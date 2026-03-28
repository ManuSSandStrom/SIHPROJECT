import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { allowRoles, protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { publicSchemas } from "../validators/index.js";

const router = Router();

router.use(protectRoute, allowRoles("admin"));
router.get("/dashboard", adminController.dashboard);
router.get("/faculty-approvals", adminController.facultyApprovals);
router.post("/faculty-approvals/:userId/approve", adminController.approveFaculty);
router.post("/faculty-approvals/:userId/reject", adminController.rejectFaculty);
router.get("/contacts", adminController.listContacts);
router.patch("/contacts/:id", adminController.updateContact);
router.get("/audit-logs", adminController.auditLogs);

router.get("/master/:resource", adminController.listResource);
router.post("/master/:resource", validate(publicSchemas.masterCreate), adminController.createResource);
router.post("/master/:resource/import", validate(publicSchemas.bulkImport), adminController.bulkImport);
router.patch("/master/:resource/:id", validate(publicSchemas.masterCreate), adminController.updateResource);
router.delete("/master/:resource/:id", adminController.deleteResource);

export default router;
