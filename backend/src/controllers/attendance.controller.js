import {
  createAttendanceSession,
  getAttendanceAnalytics,
  getMonthlyAttendanceReport,
  getSectionRoster,
  getStudentAttendanceDashboard,
  getTodayFacultyPeriods,
  listAttendanceSessions,
  overrideAttendance,
  submitAttendance,
} from "../services/attendance.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const attendanceController = {
  listSessions: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listAttendanceSessions(req.query, req.user));
  }),
  createSession: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await createAttendanceSession(req.body, req.user),
      "Attendance session prepared.",
      201,
    );
  }),
  submit: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await submitAttendance(req.body, req.user, req),
      "Attendance submitted.",
    );
  }),
  override: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await overrideAttendance(req.params.sessionId, req.params.studentId, req.body, req.user, req),
      "Attendance overridden.",
    );
  }),
  studentDashboard: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getStudentAttendanceDashboard(req.user));
  }),
  analytics: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getAttendanceAnalytics(req.query));
  }),
  monthlyReport: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await getMonthlyAttendanceReport(req.query.sectionId, req.query.month),
    );
  }),
  roster: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getSectionRoster(req.params.sectionId));
  }),
  todayFacultyPeriods: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getTodayFacultyPeriods(req.user, req.query.date));
  }),
};
