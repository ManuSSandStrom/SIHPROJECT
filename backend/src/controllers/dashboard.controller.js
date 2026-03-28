import { ROLES } from "../constants/app.js";
import { getAdminDashboard } from "../services/admin.service.js";
import {
  getStudentAttendanceDashboard,
  getTodayFacultyPeriods,
} from "../services/attendance.service.js";
import { listCycles } from "../services/feedback.service.js";
import { listIssues } from "../services/issue.service.js";
import { listTimetables } from "../services/timetable.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const dashboardController = {
  summary: asyncHandler(async (req, res) => {
    if (req.user.role === ROLES.ADMIN) {
      return sendSuccess(res, await getAdminDashboard());
    }

    if (req.user.role === ROLES.FACULTY) {
      const [todayClasses, timetables] = await Promise.all([
        getTodayFacultyPeriods(req.user),
        listTimetables({}, req.user),
      ]);
      return sendSuccess(res, {
        todayClasses,
        timetableCount: timetables.length,
      });
    }

    const [attendance, issues, feedbackCycles, timetables] = await Promise.all([
      getStudentAttendanceDashboard(req.user),
      listIssues({}, req.user),
      listCycles({ active: "true" }, req.user),
      listTimetables({}, req.user),
    ]);

    return sendSuccess(res, {
      attendance,
      issuesCount: issues.length,
      activeFeedbackCycles: feedbackCycles.length,
      latestTimetable: timetables[0] || null,
    });
  }),
};
