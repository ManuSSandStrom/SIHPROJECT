export const ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
};

export const USER_STATUSES = {
  ACTIVE: "active",
  PENDING: "pending",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const OPTIONAL_DAY = "Sunday";

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
];

export const ISSUE_CATEGORIES = [
  "attendance_issue",
  "timetable_issue",
  "faculty_issue",
  "academic_issue",
  "lab_issue",
  "infrastructure_issue",
  "technical_issue",
  "grievance_personal_issue",
  "other",
];

export const ISSUE_STATUSES = [
  "received",
  "under_review",
  "contacted",
  "in_progress",
  "solved",
  "closed",
  "rejected",
];

export const PRIORITIES = ["low", "medium", "high", "critical"];

export const FEEDBACK_CATEGORIES = [
  "teaching_quality",
  "clarity_of_explanation",
  "syllabus_coverage",
  "punctuality",
  "doubt_clarification",
  "interaction_with_students",
  "notes_material_provided",
  "lab_management",
  "lab_questions_explained",
  "communication_skills",
];

export const DEFAULT_ATTENDANCE_THRESHOLDS = {
  warning: 75,
  danger: 65,
  critical: 50,
};

export const DEFAULT_TIMETABLE_CONFIG = {
  periodsPerDay: 7,
  periodDurationMinutes: 60,
  lunchAfterPeriod: 4,
  lunchDurationMinutes: 45,
  dayStartTime: "09:00",
  includeSunday: false,
};

export const TOKEN_COOKIE = "smart_refresh_token";

export const AUDIT_ACTIONS = {
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  PASSWORD_RESET: "auth.password_reset",
  FACULTY_APPROVED: "faculty.approved",
  FACULTY_REJECTED: "faculty.rejected",
  TIMETABLE_GENERATED: "timetable.generated",
  TIMETABLE_PUBLISHED: "timetable.published",
  ATTENDANCE_SUBMITTED: "attendance.submitted",
  ATTENDANCE_OVERRIDDEN: "attendance.overridden",
  ISSUE_UPDATED: "issue.updated",
  FEEDBACK_CYCLE_UPDATED: "feedback_cycle.updated",
  MASTER_DATA_CHANGED: "master_data.changed",
};

export const MASTER_DATA_RESOURCES = {
  departments: "Department",
  programs: "Program",
  semesters: "Semester",
  sections: "Section",
  subjects: "Subject",
  classrooms: "Classroom",
  laboratories: "Laboratory",
  assignments: "FacultyAssignment",
  students: "StudentProfile",
  faculty: "FacultyProfile",
  holidays: "Holiday",
  templates: "FeedbackTemplate",
  cycles: "FeedbackCycle",
};
