import { TOKEN_COOKIE } from "../constants/app.js";
import {
  ensureDefaultAdmin,
  forgotPassword,
  getAcademicOptions,
  getCurrentUser,
  login,
  logout,
  refreshSession,
  registerFaculty,
  registerStudent,
  resetPassword,
  resetPasswordWithOtp,
} from "../services/auth.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const authController = {
  registerStudent: asyncHandler(async (req, res) => {
    const user = await registerStudent(req.body, req);
    return sendSuccess(res, user, "Student registered successfully.", 201);
  }),
  registerFaculty: asyncHandler(async (req, res) => {
    const user = await registerFaculty(req.body, req);
    return sendSuccess(
      res,
      user,
      "Faculty registration submitted and pending approval.",
      201,
    );
  }),
  academicOptions: asyncHandler(async (_req, res) => {
    const options = await getAcademicOptions();
    return sendSuccess(res, options);
  }),
  login: asyncHandler(async (req, res) => {
    const session = await login(req.body, req, res);
    return sendSuccess(res, session, "Login successful.");
  }),
  refresh: asyncHandler(async (req, res) => {
    const session = await refreshSession(req.cookies?.[TOKEN_COOKIE], res);
    return sendSuccess(res, session, "Session refreshed.");
  }),
  logout: asyncHandler(async (req, res) => {
    await logout(req.cookies?.[TOKEN_COOKIE], req, res);
    return sendSuccess(res, { acknowledged: true }, "Logged out.");
  }),
  me: asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.user);
    return sendSuccess(res, user);
  }),
  forgotPassword: asyncHandler(async (req, res) => {
    const result = await forgotPassword(req.body);
    return sendSuccess(res, result, "If the email exists, a reset link has been sent.");
  }),
  resetPassword: asyncHandler(async (req, res) => {
    const result = await resetPassword(req.body, req);
    return sendSuccess(res, result, "Password reset successful.");
  }),
  resetPasswordWithOtp: asyncHandler(async (req, res) => {
    const result = await resetPasswordWithOtp(req.body, req);
    return sendSuccess(res, result, "Password reset successful.");
  }),
  ensureDefaultAdmin: asyncHandler(async (req, res) => {
    const admin = await ensureDefaultAdmin(req.body);
    return sendSuccess(res, admin, "Default admin ensured.");
  }),
};
