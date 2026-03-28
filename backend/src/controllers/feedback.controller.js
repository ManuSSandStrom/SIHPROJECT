import {
  createCycle,
  createTemplate,
  getEligibleFaculty,
  getFeedbackAnalytics,
  listCycles,
  listFeedbackSubmissions,
  submitFeedback,
} from "../services/feedback.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const feedbackController = {
  createTemplate: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await createTemplate(req.body, req.user, req),
      "Feedback template created.",
      201,
    );
  }),
  createCycle: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await createCycle(req.body, req.user, req),
      "Feedback cycle created.",
      201,
    );
  }),
  listCycles: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listCycles(req.query, req.user));
  }),
  eligibleFaculty: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getEligibleFaculty(req.user));
  }),
  submit: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await submitFeedback(req.body, req.user, req),
      "Feedback submitted.",
      201,
    );
  }),
  listSubmissions: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listFeedbackSubmissions(req.query, req.user));
  }),
  analytics: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getFeedbackAnalytics(req.query));
  }),
};
