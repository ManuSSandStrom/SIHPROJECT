import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Course from "../models/course.js";
import Faculty from "../models/Faculty.js";
import Feedback from "../models/Feedback.js";
import Issue from "../models/Issue.js";
import Notification from "../models/Notification.js";
import Room from "../models/Room.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import Holiday from "../models/Holiday.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res) => {
  try {
    const [
      users,
      faculty,
      rooms,
      courses,
      timetables,
      attendance,
      issues,
      feedback,
      notifications,
      holidays,
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Faculty.find().sort({ createdAt: -1 }),
      Room.find().sort({ createdAt: -1 }),
      Course.find().sort({ createdAt: -1 }),
      Timetable.find().sort({ updatedAt: -1 }),
      Attendance.find().sort({ date: -1 }),
      Issue.find().sort({ createdAt: -1 }),
      Feedback.find().sort({ createdAt: -1 }),
      Notification.find().sort({ createdAt: -1 }),
      Holiday.find().sort({ date: -1, createdAt: -1 }),
    ]);

    const presentCount = attendance.filter((item) => item.status === "present").length;
    const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
    const openIssues = issues.filter((item) => item.status === "open" || item.status === "in_review").length;
    const averageFeedback =
      feedback.length > 0
        ? Number((feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1))
        : 0;

    res.json({
      kpis: {
        totalStudents: users.filter((item) => item.role === "student").length,
        totalLecturers: faculty.length,
        totalCourses: courses.length,
        activeTimetables: timetables.filter((item) => item.status !== "archived").length,
        attendanceRate,
        openIssues,
        averageFeedback,
        holidayCount: holidays.length,
      },
      latest: {
        users: users.slice(0, 5),
        timetables: timetables.slice(0, 3),
        issues: issues.slice(0, 5),
        feedback: feedback.slice(0, 5),
        notifications: notifications.slice(0, 5),
        holidays: holidays.slice(0, 5),
      },
      supportQueues: {
        issuesByStatus: {
          open: issues.filter((item) => item.status === "open").length,
          inReview: issues.filter((item) => item.status === "in_review").length,
          resolved: issues.filter((item) => item.status === "resolved").length,
        },
        feedbackByStatus: {
          new: feedback.filter((item) => item.status === "new").length,
          reviewed: feedback.filter((item) => item.status === "reviewed").length,
          actioned: feedback.filter((item) => item.status === "actioned").length,
          sharedWithLecturer: feedback.filter((item) => item.status === "shared_with_lecturer").length,
        },
      },
      campus: {
        rooms: rooms.length,
        notifications: notifications.length,
        holidays: holidays.length,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});
