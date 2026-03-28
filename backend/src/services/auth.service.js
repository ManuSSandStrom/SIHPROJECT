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
import { ApiError } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";
import { sendEmail } from "../utils/email.js";
import { serializeUser } from "../utils/profile.js";
import {
  clearRefreshCookie,
  comparePassword,
  hashPassword,
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

export async function registerStudent(payload, req) {
  const existing = await Promise.all([
    User.findOne({ email: payload.email.toLowerCase() }),
    StudentProfile.findOne({ collegeId: payload.collegeId.toUpperCase() }),
  ]);

  if (existing[0]) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existing[1]) {
    throw new ApiError(409, "College ID is already registered.");
  }

  await ensureAcademicContext(payload);

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    passwordHash: await hashPassword(payload.password),
    role: ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE,
    phone: payload.phone,
  });

  await StudentProfile.create({
    user: user._id,
    collegeId: payload.collegeId.toUpperCase(),
    rollNumber: payload.rollNumber?.toUpperCase(),
    department: payload.departmentId,
    program: payload.programId,
    semesterNumber: payload.semesterNumber,
    section: payload.sectionId,
    batchYear: payload.batchYear,
  });

  await createAuditLog({
    actor: user,
    action: "student.registered",
    entity: "StudentProfile",
    entityId: user._id,
    metadata: { collegeId: payload.collegeId },
    req,
  });

  return serializeUser(user);
}

export async function registerFaculty(payload, req) {
  const existing = await Promise.all([
    User.findOne({ email: payload.email.toLowerCase() }),
    FacultyProfile.findOne({ staffId: payload.staffId.toUpperCase() }),
    Department.findById(payload.departmentId),
  ]);

  if (existing[0]) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existing[1]) {
    throw new ApiError(409, "Faculty staff ID is already registered.");
  }

  if (!existing[2]) {
    throw new ApiError(400, "Invalid department selected.");
  }

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    passwordHash: await hashPassword(payload.password),
    role: ROLES.FACULTY,
    status: USER_STATUSES.PENDING,
    phone: payload.phone,
  });

  await FacultyProfile.create({
    user: user._id,
    staffId: payload.staffId.toUpperCase(),
    qualification: payload.qualification,
    department: payload.departmentId,
    phone: payload.phone,
    specialization: payload.specialization,
    assignedSections: payload.assignedSectionIds,
  });

  await createAuditLog({
    actor: user,
    action: "faculty.requested_access",
    entity: "FacultyProfile",
    entityId: user._id,
    metadata: { staffId: payload.staffId },
    req,
  });

  return serializeUser(user);
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

  user.lastLoginAt = new Date();
  await user.save();

  const tokenId = randomToken(12);
  const refreshToken = signRefreshToken(user, tokenId);
  await persistRefreshToken(user, refreshToken, tokenId);
  setRefreshCookie(res, refreshToken);

  await createAuditLog({
    actor: user,
    action: AUDIT_ACTIONS.LOGIN,
    entity: "User",
    entityId: user._id,
    req,
  });

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
  const user = await User.findOne({ email: payload.email.toLowerCase() });

  if (!user) {
    return { acknowledged: true };
  }

  const rawToken = randomToken(24);
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: sha256(rawToken),
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Smart Classroom password",
    text: `Reset your password using this link: ${resetUrl}`,
    html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  return { acknowledged: true };
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

  await Promise.all([resetToken.user.save(), resetToken.save()]);

  await createAuditLog({
    actor: resetToken.user,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    entity: "User",
    entityId: resetToken.user._id,
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
