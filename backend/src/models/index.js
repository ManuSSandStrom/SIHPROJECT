import mongoose from "mongoose";
import {
  ATTENDANCE_STATUSES,
  FEEDBACK_CATEGORIES,
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  PRIORITIES,
  ROLES,
  USER_STATUSES,
} from "../constants/app.js";

const { Schema } = mongoose;
const baseOptions = { timestamps: true };

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      index: true,
    },
    phone: { type: String, trim: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    avatarUrl: { type: String, trim: true },
  },
  baseOptions,
);

const StudentProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    collegeId: { type: String, required: true, uppercase: true, trim: true, unique: true },
    rollNumber: { type: String, uppercase: true, trim: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    semesterNumber: { type: Number, required: true, min: 1, max: 12, index: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    batchYear: { type: Number, required: true },
    emergencyContact: { type: String, trim: true },
  },
  baseOptions,
);

const FacultyProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    staffId: { type: String, required: true, uppercase: true, trim: true, unique: true },
    qualification: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    phone: { type: String, trim: true },
    specialization: [{ type: String, trim: true }],
    assignedSections: [{ type: Schema.Types.ObjectId, ref: "Section" }],
    maxWeeklyLoad: { type: Number, default: 20 },
    approvalNotes: { type: String, trim: true },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions,
);

const AdminProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    designation: { type: String, default: "System Administrator" },
    canManageUsers: { type: Boolean, default: true },
  },
  baseOptions,
);

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    description: { type: String, trim: true },
    hodName: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const ProgramSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    degreeLevel: { type: String, default: "UG" },
    durationSemesters: { type: Number, default: 8 },
    active: { type: Boolean, default: true },
  },
  baseOptions,
);
ProgramSchema.index({ code: 1, department: 1 }, { unique: true });

const SemesterSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    number: { type: Number, required: true, min: 1, max: 12 },
    title: { type: String, trim: true },
    workingDays: [{ type: String, trim: true }],
    periodsPerDay: { type: Number, default: 7 },
    lunchAfterPeriod: { type: Number, default: 4 },
  },
  baseOptions,
);
SemesterSchema.index({ program: 1, number: 1 }, { unique: true });

const SectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    semesterNumber: { type: Number, required: true, index: true },
    batchYear: { type: Number, required: true },
    strength: { type: Number, default: 60 },
    adviser: { type: Schema.Types.ObjectId, ref: "FacultyProfile" },
  },
  baseOptions,
);
SectionSchema.index({ code: 1, program: 1, semesterNumber: 1 }, { unique: true });

const SubjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    semesterNumber: { type: Number, required: true, index: true },
    credits: { type: Number, default: 4 },
    weeklyHours: { type: Number, default: 3 },
    labHours: { type: Number, default: 0 },
    type: { type: String, enum: ["theory", "lab", "theory_lab"], default: "theory" },
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const FacultyAssignmentSchema = new Schema(
  {
    faculty: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    semesterNumber: { type: Number, required: true },
    weeklyHoursOverride: { type: Number },
    preferredRoomType: { type: String, enum: ["classroom", "lab"], default: "classroom" },
  },
  baseOptions,
);
FacultyAssignmentSchema.index({ faculty: 1, subject: 1, section: 1 }, { unique: true });

const ClassroomSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    building: { type: String, required: true, trim: true },
    floor: { type: Number, default: 1 },
    capacity: { type: Number, required: true, min: 1 },
    features: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const LaboratorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    building: { type: String, required: true, trim: true },
    floor: { type: Number, default: 1 },
    capacity: { type: Number, required: true, min: 1 },
    labType: { type: String, default: "Computer Lab" },
    features: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const TimetableSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    semesterNumber: { type: Number, required: true, index: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    config: {
      periodsPerDay: { type: Number, default: 7 },
      periodDurationMinutes: { type: Number, default: 60 },
      lunchAfterPeriod: { type: Number, default: 4 },
      lunchDurationMinutes: { type: Number, default: 45 },
      dayStartTime: { type: String, default: "09:00" },
      includeSunday: { type: Boolean, default: false },
    },
    lockedSlots: [{ day: String, periodNumber: Number }],
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    conflicts: [
      {
        subject: String,
        reason: String,
        detail: String,
      },
    ],
  },
  baseOptions,
);

const TimetableEntrySchema = new Schema(
  {
    timetable: { type: Schema.Types.ObjectId, ref: "Timetable", required: true, index: true },
    day: { type: String, required: true, index: true },
    periodNumber: { type: Number, required: true, min: 1 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    faculty: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true, index: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom" },
    laboratory: { type: Schema.Types.ObjectId, ref: "Laboratory" },
    roomLabel: { type: String, trim: true },
    isLab: { type: Boolean, default: false },
    span: { type: Number, default: 1 },
    isLocked: { type: Boolean, default: false },
    source: { type: String, enum: ["generated", "manual"], default: "generated" },
    notes: { type: String, trim: true },
  },
  baseOptions,
);
TimetableEntrySchema.index(
  { timetable: 1, section: 1, day: 1, periodNumber: 1 },
  { unique: true },
);

const AttendanceSessionSchema = new Schema(
  {
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    faculty: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true, index: true },
    timetableEntry: { type: Schema.Types.ObjectId, ref: "TimetableEntry" },
    date: { type: Date, required: true, index: true },
    day: { type: String, required: true },
    periodNumber: { type: Number, required: true },
    status: { type: String, enum: ["open", "submitted", "frozen"], default: "open" },
    submittedAt: { type: Date },
    frozenAt: { type: Date },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions,
);
AttendanceSessionSchema.index(
  { section: 1, subject: 1, date: 1, periodNumber: 1 },
  { unique: true },
);

const AttendanceRecordSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    remarks: { type: String, trim: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  baseOptions,
);
AttendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

const AttendanceOverrideLogSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    previousStatus: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    newStatus: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    reason: { type: String, required: true, trim: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  baseOptions,
);

const HolidaySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, unique: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    section: { type: Schema.Types.ObjectId, ref: "Section" },
    fullAttendance: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  baseOptions,
);

const IssueSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    category: { type: String, enum: ISSUE_CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: PRIORITIES, default: "medium", index: true },
    status: { type: String, enum: ISSUE_STATUSES, default: "received", index: true },
    confidential: { type: Boolean, default: false },
    attachmentUrl: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    lastReplyAt: { type: Date },
  },
  baseOptions,
);

const IssueReplySchema = new Schema(
  {
    issue: { type: Schema.Types.ObjectId, ref: "Issue", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
    internal: { type: Boolean, default: false },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
  },
  baseOptions,
);

const FeedbackCycleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program" },
    semesterNumber: { type: Number, index: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", index: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: false, index: true },
    feedbackTemplate: { type: Schema.Types.ObjectId, ref: "FeedbackTemplate", required: true },
  },
  baseOptions,
);

const FeedbackTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    questions: [
      {
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        category: { type: String, enum: FEEDBACK_CATEGORIES, required: true },
        type: { type: String, enum: ["rating", "text"], default: "rating" },
        maxScore: { type: Number, default: 5 },
      },
    ],
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const FeedbackSubmissionSchema = new Schema(
  {
    cycle: { type: Schema.Types.ObjectId, ref: "FeedbackCycle", required: true, index: true },
    template: { type: Schema.Types.ObjectId, ref: "FeedbackTemplate", required: true },
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    faculty: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    responses: [
      {
        key: String,
        label: String,
        category: String,
        score: Number,
        value: String,
      },
    ],
    averageRating: { type: Number, required: true },
    strengths: { type: String, trim: true },
    areasToImprove: { type: String, trim: true },
    additionalComments: { type: String, trim: true },
    isAnonymous: { type: Boolean, default: true },
  },
  baseOptions,
);
FeedbackSubmissionSchema.index(
  { cycle: 1, student: 1, faculty: 1, section: 1 },
  { unique: true },
);

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    collegeId: { type: String, trim: true, uppercase: true },
    category: { type: String, default: "general" },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
  },
  baseOptions,
);

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: { type: String, enum: ["all", "role", "user"], default: "all" },
    roles: [{ type: String, enum: Object.values(ROLES) }],
    user: { type: Schema.Types.ObjectId, ref: "User" },
    link: { type: String, trim: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  baseOptions,
);

const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, enum: Object.values(ROLES) },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, trim: true },
    entityId: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  baseOptions,
);

const RefreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenId: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
  },
  baseOptions,
);

const PasswordResetTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
  },
  baseOptions,
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const StudentProfile =
  mongoose.models.StudentProfile ||
  mongoose.model("StudentProfile", StudentProfileSchema);
export const FacultyProfile =
  mongoose.models.FacultyProfile ||
  mongoose.model("FacultyProfile", FacultyProfileSchema);
export const AdminProfile =
  mongoose.models.AdminProfile ||
  mongoose.model("AdminProfile", AdminProfileSchema);
export const Department =
  mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
export const Program =
  mongoose.models.Program || mongoose.model("Program", ProgramSchema);
export const Semester =
  mongoose.models.Semester || mongoose.model("Semester", SemesterSchema);
export const Section =
  mongoose.models.Section || mongoose.model("Section", SectionSchema);
export const Subject =
  mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
export const FacultyAssignment =
  mongoose.models.FacultyAssignment ||
  mongoose.model("FacultyAssignment", FacultyAssignmentSchema);
export const Classroom =
  mongoose.models.Classroom || mongoose.model("Classroom", ClassroomSchema);
export const Laboratory =
  mongoose.models.Laboratory || mongoose.model("Laboratory", LaboratorySchema);
export const Timetable =
  mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
export const TimetableEntry =
  mongoose.models.TimetableEntry ||
  mongoose.model("TimetableEntry", TimetableEntrySchema);
export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model("AttendanceSession", AttendanceSessionSchema);
export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export const AttendanceOverrideLog =
  mongoose.models.AttendanceOverrideLog ||
  mongoose.model("AttendanceOverrideLog", AttendanceOverrideLogSchema);
export const Holiday =
  mongoose.models.Holiday || mongoose.model("Holiday", HolidaySchema);
export const Issue = mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
export const IssueReply =
  mongoose.models.IssueReply || mongoose.model("IssueReply", IssueReplySchema);
export const FeedbackCycle =
  mongoose.models.FeedbackCycle ||
  mongoose.model("FeedbackCycle", FeedbackCycleSchema);
export const FeedbackTemplate =
  mongoose.models.FeedbackTemplate ||
  mongoose.model("FeedbackTemplate", FeedbackTemplateSchema);
export const FeedbackSubmission =
  mongoose.models.FeedbackSubmission ||
  mongoose.model("FeedbackSubmission", FeedbackSubmissionSchema);
export const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);
export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
export const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", RefreshTokenSchema);
export const PasswordResetToken =
  mongoose.models.PasswordResetToken ||
  mongoose.model("PasswordResetToken", PasswordResetTokenSchema);
