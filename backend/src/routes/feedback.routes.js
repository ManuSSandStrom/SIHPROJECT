import { Router } from "express";
import { feedbackController } from "../controllers/feedback.controller.js";
import { allowRoles, protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { feedbackSchemas } from "../validators/index.js";

const router = Router();

router.use(protectRoute);
router.get("/cycles", feedbackController.listCycles);
router.get("/eligible-faculty", allowRoles("student"), feedbackController.eligibleFaculty);
router.get("/submissions", feedbackController.listSubmissions);
router.get("/analytics", allowRoles("admin"), feedbackController.analytics);
router.post("/templates", allowRoles("admin"), validate(feedbackSchemas.template), feedbackController.createTemplate);
router.post("/cycles", allowRoles("admin"), validate(feedbackSchemas.cycle), feedbackController.createCycle);
router.post("/submit", allowRoles("student"), validate(feedbackSchemas.submit), feedbackController.submit);

export default router;
