import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { publicController } from "../controllers/public.controller.js";
import { reportController } from "../controllers/report.controller.js";
import { allowRoles, protectRoute } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { publicSchemas } from "../validators/index.js";
import {
  Department,
  FacultyProfile,
  Section,
  StudentProfile,
  Subject,
} from "../models/index.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

const contactRouter = Router();
contactRouter.post("/", validate(publicSchemas.contact), publicController.createContactMessage);

const dashboardRouter = Router();
dashboardRouter.use(protectRoute);
dashboardRouter.get("/summary", dashboardController.summary);

const notificationsRouter = Router();
notificationsRouter.use(protectRoute);
notificationsRouter.get("/", publicController.listNotifications);
notificationsRouter.post("/:id/read", publicController.markNotificationRead);

const reportsRouter = Router();
reportsRouter.use(protectRoute, allowRoles("admin"));
reportsRouter.get("/:type/csv", reportController.csv);
reportsRouter.get("/:type/pdf", reportController.pdf);

function createReadOnlyRouter(model, populate = "") {
  const router = Router();
  router.use(protectRoute);
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const items = await model.find({}).populate(populate).sort({ createdAt: -1 });
      return sendSuccess(res, items);
    }),
  );
  return router;
}

export const departmentsRouter = createReadOnlyRouter(Department);
export const subjectsRouter = createReadOnlyRouter(Subject, "department program");
export const sectionsRouter = createReadOnlyRouter(Section, "department program adviser");
export const facultyRouter = createReadOnlyRouter(FacultyProfile, "user department assignedSections");
export const studentsRouter = createReadOnlyRouter(StudentProfile, "user department program section");

export {
  contactRouter,
  dashboardRouter,
  notificationsRouter,
  reportsRouter,
};
