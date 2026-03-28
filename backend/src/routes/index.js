import { Router } from "express";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import timetableRoutes from "./timetable.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import issueRoutes from "./issues.routes.js";
import feedbackRoutes from "./feedback.routes.js";
import {
  contactRouter,
  dashboardRouter,
  departmentsRouter,
  facultyRouter,
  notificationsRouter,
  reportsRouter,
  sectionsRouter,
  studentsRouter,
  subjectsRouter,
} from "./public.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/students", studentsRouter);
router.use("/faculty", facultyRouter);
router.use("/departments", departmentsRouter);
router.use("/subjects", subjectsRouter);
router.use("/sections", sectionsRouter);
router.use("/timetable", timetableRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/issues", issueRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/contact", contactRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);
router.use("/notifications", notificationsRouter);

export default router;
