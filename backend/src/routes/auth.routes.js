import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { authSchemas } from "../validators/index.js";

const router = Router();

router.post("/student/register", validate(authSchemas.studentRegister), authController.registerStudent);
router.post("/faculty/register", validate(authSchemas.facultyRegister), authController.registerFaculty);
router.post("/login", validate(authSchemas.login), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", protectRoute, authController.me);
router.post("/forgot-password", validate(authSchemas.forgotPassword), authController.forgotPassword);
router.post("/reset-password", validate(authSchemas.resetPassword), authController.resetPassword);

export default router;
