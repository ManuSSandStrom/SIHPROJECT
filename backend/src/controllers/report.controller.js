import { buildPdfBuffer, toCsv } from "../utils/export.js";
import { asyncHandler } from "../utils/api.js";
import { getAttendanceAnalytics, getMonthlyAttendanceReport } from "../services/attendance.service.js";
import { getFeedbackAnalytics } from "../services/feedback.service.js";
import { listTimetables } from "../services/timetable.service.js";

export const reportController = {
  csv: asyncHandler(async (req, res) => {
    let rows = [];
    const type = req.params.type;

    if (type === "attendance") {
      rows = await getMonthlyAttendanceReport(req.query.sectionId, req.query.month);
    } else if (type === "feedback") {
      rows = (await getFeedbackAnalytics(req.query)).submissions.map((item) => ({
        faculty: item.faculty?.user?.fullName || "",
        subject: item.subject?.name || "",
        rating: item.averageRating,
      }));
    } else if (type === "timetable") {
      rows = (await listTimetables(req.query, req.user)).flatMap((table) =>
        (table.entries || []).map((entry) => ({
          timetable: table.title,
          day: entry.day,
          period: entry.periodNumber,
          subject: entry.subject?.name || entry.subject,
          room: entry.roomLabel,
        })),
      );
    } else {
      rows = Object.entries(await getAttendanceAnalytics(req.query)).map(([key, value]) => ({
        metric: key,
        value: Array.isArray(value) ? value.length : value,
      }));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-report.csv"`);
    res.send(toCsv(rows));
  }),
  pdf: asyncHandler(async (req, res) => {
    const type = req.params.type;
    let sections = [];

    if (type === "attendance") {
      const rows = await getMonthlyAttendanceReport(req.query.sectionId, req.query.month);
      sections = [
        {
          heading: "Attendance Report",
          lines: rows.slice(0, 60).map((row) => `${row.date} | ${row.student} | ${row.subject} | ${row.status}`),
        },
      ];
    } else if (type === "feedback") {
      const analytics = await getFeedbackAnalytics(req.query);
      sections = [
        {
          heading: "Faculty Summary",
          lines: analytics.facultySummary.map((item) => `${item.facultyName}: ${item.averageRating}/5 (${item.totalSubmissions} submissions)`),
        },
      ];
    } else {
      const timetables = await listTimetables(req.query, req.user);
      const table = timetables[0];
      sections = [
        {
          heading: table?.title || "Timetable",
          lines: (table?.entries || [])
            .slice(0, 60)
            .map((entry) => `${entry.day} P${entry.periodNumber} | ${entry.subject?.name || entry.subject} | ${entry.roomLabel}`),
        },
      ];
    }

    const pdfBuffer = await buildPdfBuffer({
      title: `${type.toUpperCase()} Report`,
      subtitle: new Date().toISOString(),
      sections,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-report.pdf"`);
    res.send(pdfBuffer);
  }),
};
