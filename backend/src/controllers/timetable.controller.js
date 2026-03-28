import {
  generateWeeklyTimetable,
  getFacultyTimetable,
  listTimetables,
  publishTimetable,
  regenerateDay,
  updateTimetableEntry,
} from "../services/timetable.service.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const timetableController = {
  list: asyncHandler(async (req, res) => {
    return sendSuccess(res, await listTimetables(req.query, req.user));
  }),
  generate: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await generateWeeklyTimetable(req.body, req.user, req),
      "Weekly timetable generated.",
      201,
    );
  }),
  updateEntry: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await updateTimetableEntry(req.params.id, req.params.entryId, req.body),
      "Timetable entry updated.",
    );
  }),
  publish: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await publishTimetable(req.params.id, req.user, req),
      "Timetable published.",
    );
  }),
  regenerateDay: asyncHandler(async (req, res) => {
    return sendSuccess(
      res,
      await regenerateDay(req.params.id, req.body, req.user, req),
      "Selected day regenerated.",
    );
  }),
  facultyView: asyncHandler(async (req, res) => {
    return sendSuccess(res, await getFacultyTimetable(req.user));
  }),
};
