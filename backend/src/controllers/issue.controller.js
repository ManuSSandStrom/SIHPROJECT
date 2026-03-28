import {
  createIssue,
  getIssueById,
  listIssues,
  replyToIssue,
  updateIssue,
} from "../services/issue.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const issueController = {
  create: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await createIssue(req.body, req.user, req),
      "Issue created.",
      201,
    );
  }),
  list: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listIssues(req.query, req.user));
  }),
  detail: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getIssueById(req.params.id, req.user));
  }),
  reply: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await replyToIssue(req.params.id, req.body, req.user, req),
      "Reply added.",
      201,
    );
  }),
  update: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await updateIssue(req.params.id, req.body, req.user, req),
      "Issue updated.",
    );
  }),
};
