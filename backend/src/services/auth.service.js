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

async function ensureAcademicContext({ departmentId, programId, sectionId }) {
  const [department, program, section] = await Promise.all([
    Department.findById(departmentId),
    Program.findById(programId),
    Section.findById(sectionId),
  ]);

  if (!department || !program || !section) {
    throw new ApiError(400, "Invalid department, program, or section.");
  }

  return { department, program, section };
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
  const [existingEmail, existingCollegeId, _academicContext, passwordHash] = await Promise.all([
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

  await Promise.all([
    StudentProfile.create({
      user: user._id,
      collegeId: payload.collegeId.toUpperCase(),
      rollNumber: payload.rollNumber?.toUpperCase(),
      department: payload.departmentId,
      program: payload.programId,
      semesterNumber: payload.semesterNumber,
      section: payload.sectionId,
      batchYear: payload.batchYear,
    }),
    createAuditLog({
      actor: user,
      action: "student.registered",
      entity: "StudentProfile",
      entityId: user._id,
      metadata: { collegeId: payload.collegeId },
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
  const [departments, programs, sections] = await Promise.all([
    Department.find({ active: true }).sort({ name: 1 }),
    Program.find({ active: true }).sort({ name: 1 }).populate("department", "name code"),
    Section.find({})
      .sort({ semesterNumber: 1, batchYear: -1, name: 1 })
      .populate("department", "name code")
      .populate("program", "name code degreeLevel"),
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
      label: `${program.name} (${program.code})`,
    })),
    sections: sections.map((section) => ({
      _id: String(section._id),
      name: section.name,
      code: section.code,
      departmentId: String(section.department?._id || section.department),
      programId: String(section.program?._id || section.program),
      semesterNumber: section.semesterNumber,
      batchYear: section.batchYear,
      label: `${section.name} (${section.code}) | Semester ${section.semesterNumber} | ${section.batchYear}`,
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
