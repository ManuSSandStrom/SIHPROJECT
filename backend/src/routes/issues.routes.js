import { Router } from "express";
import { issueController } from "../controllers/issue.controller.js";
import { allowRoles, protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { issueSchemas } from "../validators/index.js";

const router = Router();

router.use(protectRoute);
router.get("/", issueController.list);
router.get("/:id", issueController.detail);
router.post("/", allowRoles("student"), validate(issueSchemas.create), issueController.create);
router.post("/:id/replies", validate(issueSchemas.reply), issueController.reply);
router.patch("/:id", allowRoles("admin"), validate(issueSchemas.update), issueController.update);

export default router;
