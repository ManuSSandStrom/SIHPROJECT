import {
  approveFaculty,
  bulkImportResource,
  createResource,
  deleteResource,
  getAdminDashboard,
  getAdminSetupOptions,
  listAuditLogs,
  listContactMessages,
  listPendingFaculty,
  listResource,
  rejectFaculty,
  updateContactMessage,
  updateResource,
} from "../services/admin.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const adminController = {
  dashboard: asyncHandler(async (_req, res) => {
    return sendSuccess(res, await getAdminDashboard());
  }),
  setupOptions: asyncHandler(async (_req, res) => {
    return sendSuccess(res, await getAdminSetupOptions());
  }),
  listResource: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listResource(req.params.resource, req.query));
  }),
  createResource: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await createResource(req.params.resource, req.body, req.user, req),
      "Resource created.",
      201,
    );
  }),
  updateResource: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await updateResource(req.params.resource, req.params.id, req.body, req.user, req),
      "Resource updated.",
    );
  }),
  deleteResource: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await deleteResource(req.params.resource, req.params.id, req.user, req),
      "Resource deleted.",
    );
  }),
  bulkImport: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await bulkImportResource(req.params.resource, req.body.rows, req.user, req),
      "Bulk import completed.",
      201,
    );
  }),
  facultyApprovals: asyncHandler(async (_req, res) => {
    return sendSuccess(res, await listPendingFaculty());
  }),
  approveFaculty: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await approveFaculty(req.params.userId, req.user, req),
      "Faculty approved.",
    );
  }),
  rejectFaculty: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await rejectFaculty(req.params.userId, req.body.reason, req.user, req),
      "Faculty rejected.",
    );
  }),
  listContacts: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listContactMessages(req.query));
  }),
  updateContact: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await updateContactMessage(req.params.id, req.body),
      "Contact message updated.",
    );
  }),
  auditLogs: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listAuditLogs(req.query));
  }),
};
