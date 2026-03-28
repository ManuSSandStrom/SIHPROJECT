import { z } from "zod";
import {
  ATTENDANCE_STATUSES,
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  PRIORITIES,
} from "../constants/app.js";

const objectId = z.string().min(24);

export const authSchemas = {
  studentRegister: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().optional(),
    collegeId: z.string().min(3),
    rollNumber: z.string().optional(),
    departmentId: objectId,
    programId: objectId,
    semesterNumber: z.number().min(1).max(12),
    sectionId: objectId,
    batchYear: z.number().min(2000).max(2100),
  }),
  facultyRegister: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().optional(),
    staffId: z.string().min(3),
    qualification: z.string().min(2),
    departmentId: objectId,
    specialization: z.array(z.string()).default([]),
    assignedSectionIds: z.array(objectId).default([]),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  forgotPassword: z.object({
    email: z.string().email(),
  }),
  resetPassword: z.object({
    token: z.string().min(12),
    password: z.string().min(8),
  }),
  resetPasswordWithOtp: z.object({
    email: z.string().email(),
    requestId: z.string().min(12),
    otp: z.string().regex(/^\d{6}$/),
    password: z.string().min(8),
  }),
};

export const timetableSchemas = {
  generate: z.object({
    sectionId: objectId,
    periodsPerDay: z.number().min(4).max(10).optional(),
    periodDurationMinutes: z.number().min(30).max(120).optional(),
    lunchAfterPeriod: z.number().min(1).max(8).optional(),
    lunchDurationMinutes: z.number().min(15).max(90).optional(),
    dayStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    includeSunday: z.boolean().optional(),
  }),
  updateEntry: z.object({
    subjectId: objectId.optional(),
    facultyId: objectId.optional(),
    classroomId: objectId.optional(),
    laboratoryId: objectId.optional(),
    notes: z.string().optional(),
    isLocked: z.boolean().optional(),
  }),
  regenerateDay: z.object({
    day: z.string().min(3),
  }),
};

export const attendanceSchemas = {
  createSession: z.object({
    timetableEntryId: objectId.optional(),
    sectionId: objectId,
    subjectId: objectId,
    facultyId: objectId.optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    day: z.string().min(3),
    periodNumber: z.number().min(1).max(10),
  }),
  submit: z.object({
    sessionId: objectId,
    records: z.array(
      z.object({
        studentId: objectId,
        status: z.enum(ATTENDANCE_STATUSES),
        remarks: z.string().optional(),
      }),
    ),
  }),
  override: z.object({
    status: z.enum(ATTENDANCE_STATUSES),
    reason: z.string().min(5),
  }),
};

export const issueSchemas = {
  create: z.object({
    category: z.enum(ISSUE_CATEGORIES),
    title: z.string().min(5),
    description: z.string().min(10),
    priority: z.enum(PRIORITIES).default("medium"),
    confidential: z.boolean().default(false),
    attachmentUrl: z.string().url().optional().or(z.literal("")),
  }),
  reply: z.object({
    message: z.string().min(2),
    internal: z.boolean().default(false),
    visibility: z.enum(["public", "private"]).default("public"),
  }),
  update: z.object({
    status: z.enum(ISSUE_STATUSES).optional(),
    internalNotes: z.string().optional(),
    priority: z.enum(PRIORITIES).optional(),
  }),
};

export const feedbackSchemas = {
  cycle: z.object({
    title: z.string().min(3),
    departmentId: objectId.optional(),
    programId: objectId.optional(),
    semesterNumber: z.number().min(1).max(12).optional(),
    sectionId: objectId.optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    active: z.boolean().default(true),
    feedbackTemplateId: objectId,
  }),
  template: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    questions: z.array(
      z.object({
        key: z.string().min(2),
        label: z.string().min(3),
        category: z.string().min(3),
        type: z.enum(["rating", "text"]).default("rating"),
        maxScore: z.number().min(1).max(10).default(5),
      }),
    ),
  }),
  submit: z.object({
    cycleId: objectId,
    facultyId: objectId,
    subjectId: objectId,
    responses: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        category: z.string(),
        score: z.number().min(1).max(5).optional(),
        value: z.string().optional(),
      }),
    ),
    strengths: z.string().optional(),
    areasToImprove: z.string().optional(),
    additionalComments: z.string().optional(),
    isAnonymous: z.boolean().default(true),
  }),
};

export const publicSchemas = {
  contact: z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email(),
    collegeId: z.string().optional(),
    category: z.string().min(2),
    message: z.string().min(10),
  }),
  masterCreate: z.record(z.any()),
  bulkImport: z.object({
    rows: z.array(z.record(z.any())),
  }),
};
