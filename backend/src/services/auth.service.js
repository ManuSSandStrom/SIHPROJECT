import {
  AUDIT_ACTIONS,
  ROLES,
  USER_STATUSES,
} from "../constants/app.js";
import {
  AdminProfile,
  Department,
  FacultyProfile,
  PasswordResetToken,
  Program,
  RefreshToken,
  Semester,
  Section,
  StudentProfile,
  User,
} from "../models/index.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";
import { queueEmail } from "../utils/email.js";
import { serializeUser } from "../utils/profile.js";
import {
  clearRefreshCookie,
  comparePassword,
  hashPassword,
  randomOtpCode,
  randomToken,
  setRefreshCookie,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/security.js";

async function ensureAcademicContext({ departmentId, programId }) {
  const [department, program] = await Promise.all([
    Department.findById(departmentId),
    Program.findById(programId),
  ]);

  if (!department || !program) {
    throw new ApiError(400, "Invalid department or program.");
  }

  if (String(program.department) !== String(department._id)) {
    throw new ApiError(400, "Selected program does not belong to the chosen department.");
  }

  return { department, program };
}

async function resolveOrCreateSection({ departmentId, programId, semesterNumber, batchYear, sectionName }) {
  const normalizedSection = sectionName.trim().toUpperCase();
  let section = await Section.findOne({
    department: departmentId,
    program: programId,
    semesterNumber,
    code: normalizedSection,
  });

  if (section) {
    return section;
  }

  try {
    section = await Section.create({
      name: `Section ${normalizedSection}`,
      code: normalizedSection,
      department: departmentId,
      program: programId,
      semesterNumber,
      batchYear,
      strength: 60,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    section = await Section.findOne({
      department: departmentId,
      program: programId,
      semesterNumber,
      code: normalizedSection,
    });
  }

  return section;
}

async function persistRefreshToken(user, rawToken, tokenId) {
  const tokenHash = sha256(rawToken);
  await RefreshToken.create({
    user: user._id,
    tokenId,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

async function expirePendingPasswordResets(userId) {
  await PasswordResetToken.updateMany(
    { user: userId, usedAt: null, expiresAt: { $gt: new Date() } },
    { usedAt: new Date() },
  );
}

function queuePasswordResetEmail({ email, otp, resetUrl }) {
  return queueEmail({
    to: email,
    subject: "Smart Classroom password recovery",
    text: `Your Smart Classroom OTP is ${otp}. It expires in 10 minutes. You can also reset using this link: ${resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>Your Smart Classroom password recovery code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#1d4ed8">${otp}</p>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you prefer, you can also reset your password directly using this secure link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
    `,
  });
}

export async function registerStudent(payload, req) {
  const [existingEmail, existingCollegeId, academicContext, passwordHash] = await Promise.all([
    User.findOne({ email: payload.email.toLowerCase() }),
    StudentProfile.findOne({ collegeId: payload.collegeId.toUpperCase() }),
    ensureAcademicContext(payload),
    hashPassword(payload.password),
  ]);

  if (existingEmail) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existingCollegeId) {
    throw new ApiError(409, "College ID is already registered.");
  }

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    passwordHash,
    role: ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE,
    phone: payload.phone,
  });

  const section = await resolveOrCreateSection({
    departmentId: academicContext.department._id,
    programId: academicContext.program._id,
    semesterNumber: payload.semesterNumber,
    batchYear: payload.batchYear,
    sectionName: payload.sectionName,
  });

  await Promise.all([
    StudentProfile.create({
      user: user._id,
      collegeId: payload.collegeId.toUpperCase(),
      rollNumber: payload.rollNumber?.toUpperCase(),
      department: payload.departmentId,
      program: payload.programId,
      semesterNumber: payload.semesterNumber,
      section: section._id,
      batchYear: payload.batchYear,
    }),
    createAuditLog({
      actor: user,
      action: "student.registered",
      entity: "StudentProfile",
      entityId: user._id,
      metadata: { collegeId: payload.collegeId, sectionCode: section.code },
      req,
    }),
  ]);

  return serializeUser(user);
}

export async function registerFaculty(payload, req) {
  const [existingEmail, existingStaffId, department, passwordHash] = await Promise.all([
    User.findOne({ email: payload.email.toLowerCase() }),
    FacultyProfile.findOne({ staffId: payload.staffId.toUpperCase() }),
    Department.findById(payload.departmentId),
    hashPassword(payload.password),
  ]);

  if (existingEmail) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existingStaffId) {
    throw new ApiError(409, "Faculty staff ID is already registered.");
  }

  if (!department) {
    throw new ApiError(400, "Invalid department selected.");
  }

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    passwordHash,
    role: ROLES.FACULTY,
    status: USER_STATUSES.PENDING,
    phone: payload.phone,
  });

  await Promise.all([
    FacultyProfile.create({
      user: user._id,
      staffId: payload.staffId.toUpperCase(),
      qualification: payload.qualification,
      department: payload.departmentId,
      phone: payload.phone,
      specialization: payload.specialization,
      assignedSections: payload.assignedSectionIds,
    }),
    createAuditLog({
      actor: user,
      action: "faculty.requested_access",
      entity: "FacultyProfile",
      entityId: user._id,
      metadata: { staffId: payload.staffId },
      req,
    }),
  ]);

  return serializeUser(user);
}

export async function getAcademicOptions() {
  const [departments, programs, semesters] = await Promise.all([
    Department.find({ active: true }).sort({ name: 1 }),
    Program.find({ active: true }).sort({ name: 1 }).populate("department", "name code"),
    Semester.find({})
      .sort({ number: 1 })
      .populate({
        path: "program",
        select: "name code degreeLevel department durationSemesters",
        populate: { path: "department", select: "name code" },
      }),
  ]);

  return {
    departments: departments.map((department) => ({
      _id: String(department._id),
      name: department.name,
      code: department.code,
      label: `${department.name} (${department.code})`,
    })),
    programs: programs.map((program) => ({
      _id: String(program._id),
      name: program.name,
      code: program.code,
      degreeLevel: program.degreeLevel,
      departmentId: String(program.department?._id || program.department),
      label: `${program.name} (${program.code}) - ${program.degreeLevel}`,
    })),
    semesters: semesters.map((semester) => ({
      _id: String(semester._id),
      number: semester.number,
      title: semester.title || `Semester ${semester.number}`,
      programId: String(semester.program?._id || semester.program),
      label: semester.title || `Semester ${semester.number}`,
    })),
  };
}

export async function login(payload, req, res) {
  const user = await User.findOne({ email: payload.email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await comparePassword(
    payload.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (
    user.role === ROLES.FACULTY &&
    user.status !== USER_STATUSES.ACTIVE
  ) {
    throw new ApiError(
      403,
      "Faculty access is pending admin approval.",
    );
  }

  if (user.status === USER_STATUSES.SUSPENDED) {
    throw new ApiError(403, "This account is suspended.");
  }

  const loginAt = new Date();
  user.lastLoginAt = loginAt;
  const tokenId = randomToken(12);
  const refreshToken = signRefreshToken(user, tokenId);
  setRefreshCookie(res, refreshToken);

  await Promise.all([
    User.updateOne({ _id: user._id }, { lastLoginAt: loginAt }),
    persistRefreshToken(user, refreshToken, tokenId),
    createAuditLog({
      actor: user,
      action: AUDIT_ACTIONS.LOGIN,
      entity: "User",
      entityId: user._id,
      req,
    }),
  ]);

  return {
    accessToken: signAccessToken(user),
    user: await serializeUser(user),
  };
}

export async function refreshSession(rawRefreshToken, res) {
  if (!rawRefreshToken) {
    throw new ApiError(401, "Refresh token is required.");
  }

  const payload = verifyRefreshToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({
    tokenId: payload.tokenId,
    tokenHash: sha256(rawRefreshToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!stored?.user) {
    throw new ApiError(401, "Refresh session is invalid or expired.");
  }

  stored.revokedAt = new Date();
  await stored.save();

  const nextTokenId = randomToken(12);
  const nextRefreshToken = signRefreshToken(stored.user, nextTokenId);
  await persistRefreshToken(stored.user, nextRefreshToken, nextTokenId);
  setRefreshCookie(res, nextRefreshToken);

  return {
    accessToken: signAccessToken(stored.user),
    user: await serializeUser(stored.user),
  };
}

export async function logout(rawRefreshToken, req, res) {
  if (rawRefreshToken) {
    const decoded = verifyRefreshToken(rawRefreshToken);
    await RefreshToken.findOneAndUpdate(
      {
        tokenId: decoded.tokenId,
      },
      {
        revokedAt: new Date(),
      },
    );

    const user = decoded?.sub ? await User.findById(decoded.sub) : null;
    if (user) {
      await createAuditLog({
        actor: user,
        action: AUDIT_ACTIONS.LOGOUT,
        entity: "User",
        entityId: user._id,
        req,
      });
    }
  }

  clearRefreshCookie(res);
}

export async function getCurrentUser(user) {
  return serializeUser(user);
}

export async function forgotPassword(payload) {
  const requestId = randomToken(12);
  const user = await User.findOne({ email: payload.email.toLowerCase() }).select("_id email");

  if (!user) {
    return {
      acknowledged: true,
      requestId,
      expiresInMinutes: 10,
    };
  }

  const rawToken = randomToken(24);
  const otp = randomOtpCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

  await expirePendingPasswordResets(user._id);
  const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;
  await PasswordResetToken.insertMany([
    {
      user: user._id,
      tokenHash: sha256(requestId),
      otpHash: sha256(`${requestId}:${otp}`),
      delivery: "hybrid",
      expiresAt,
    },
    {
      user: user._id,
      tokenHash: sha256(rawToken),
      delivery: "link",
      expiresAt,
    },
  ]);

  queuePasswordResetEmail({
    email: user.email,
    otp,
    resetUrl,
  });

  return {
    acknowledged: true,
    requestId,
    expiresInMinutes: 10,
  };
}

export async function resetPassword(payload, req) {
  const tokenHash = sha256(payload.token);
  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!resetToken?.user) {
    throw new ApiError(400, "Reset token is invalid or expired.");
  }

  resetToken.user.passwordHash = await hashPassword(payload.password);
  resetToken.user.passwordChangedAt = new Date();
  resetToken.usedAt = new Date();

  await Promise.all([
    resetToken.user.save(),
    resetToken.save(),
    PasswordResetToken.updateMany(
      { user: resetToken.user._id, usedAt: null },
      { usedAt: new Date() },
    ),
  ]);

  await createAuditLog({
    actor: resetToken.user,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    entity: "User",
    entityId: resetToken.user._id,
    req,
  });

  return { acknowledged: true };
}

export async function resetPasswordWithOtp(payload, req) {
  const requestHash = sha256(payload.requestId);
  const otpHash = sha256(`${payload.requestId}:${payload.otp}`);
  const resetToken = await PasswordResetToken.findOne({
    tokenHash: requestHash,
    otpHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!resetToken?.user || resetToken.user.email !== payload.email.toLowerCase()) {
    throw new ApiError(400, "OTP is invalid or expired.");
  }

  resetToken.user.passwordHash = await hashPassword(payload.password);
  resetToken.user.passwordChangedAt = new Date();
  resetToken.usedAt = new Date();

  await Promise.all([
    resetToken.user.save(),
    resetToken.save(),
    PasswordResetToken.updateMany(
      { user: resetToken.user._id, usedAt: null },
      { usedAt: new Date() },
    ),
  ]);

  await createAuditLog({
    actor: resetToken.user,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    entity: "User",
    entityId: resetToken.user._id,
    metadata: { method: "otp" },
    req,
  });

  return { acknowledged: true };
}

export async function ensureDefaultAdmin({ email, password }) {
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    user = await User.create({
      fullName: "Platform Administrator",
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      role: ROLES.ADMIN,
      status: USER_STATUSES.ACTIVE,
    });

    await AdminProfile.create({
      user: user._id,
    });
  }

  return user;
}
