import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller.js";
import { allowRoles, protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { attendanceSchemas } from "../validators/index.js";

const router = Router();

router.use(protectRoute);
router.get("/sessions", attendanceController.listSessions);
router.get("/analytics", allowRoles("admin"), attendanceController.analytics);
router.get("/monthly-report", allowRoles("admin"), attendanceController.monthlyReport);
router.get("/student-dashboard", allowRoles("student"), attendanceController.studentDashboard);
router.get("/today-periods", allowRoles("faculty"), attendanceController.todayFacultyPeriods);
router.get("/roster/:sectionId", allowRoles("admin", "faculty"), attendanceController.roster);
router.post("/sessions", allowRoles("admin", "faculty"), validate(attendanceSchemas.createSession), attendanceController.createSession);
router.post("/submit", allowRoles("admin", "faculty"), validate(attendanceSchemas.submit), attendanceController.submit);
router.patch("/sessions/:sessionId/students/:studentId", allowRoles("admin"), validate(attendanceSchemas.override), attendanceController.override);

export default router;
