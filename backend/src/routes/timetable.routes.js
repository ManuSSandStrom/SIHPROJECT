import { Router } from "express";
import { timetableController } from "../controllers/timetable.controller.js";
import { allowRoles, protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { timetableSchemas } from "../validators/index.js";

const router = Router();

router.use(protectRoute);
router.get("/", timetableController.list);
router.get("/faculty-view", allowRoles("faculty"), timetableController.facultyView);
router.post("/generate", allowRoles("admin"), validate(timetableSchemas.generate), timetableController.generate);
router.patch("/:id/entries/:entryId", allowRoles("admin"), validate(timetableSchemas.updateEntry), timetableController.updateEntry);
router.post("/:id/publish", allowRoles("admin"), timetableController.publish);
router.post("/:id/regenerate-day", allowRoles("admin"), validate(timetableSchemas.regenerateDay), timetableController.regenerateDay);

export default router;
