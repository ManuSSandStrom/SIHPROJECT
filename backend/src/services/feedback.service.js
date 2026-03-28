import { ROLES } from "../constants/app.js";
import {
  FacultyAssignment,
  FeedbackCycle,
  FeedbackSubmission,
  FeedbackTemplate,
  FacultyProfile,
  Notification,
} from "../models/index.js";
import { ApiError } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";
import { loadUserProfile } from "../utils/profile.js";

export async function createTemplate(payload, user, req) {
  const template = await FeedbackTemplate.create(payload);
  await createAuditLog({
    actor: user,
    action: "feedback_template.created",
    entity: "FeedbackTemplate",
    entityId: template._id,
    req,
  });
  return template;
}

export async function createCycle(payload, user, req) {
  const cycle = await FeedbackCycle.create({
    title: payload.title,
    department: payload.departmentId,
    program: payload.programId,
    semesterNumber: payload.semesterNumber,
    section: payload.sectionId,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    active: payload.active,
    feedbackTemplate: payload.feedbackTemplateId,
  });

  await Notification.create({
    title: "New lecturer feedback form published",
    message: `A new feedback cycle "${payload.title}" is now available for students. Open the student feedback workspace to respond before the closing date.`,
    audience: "role",
    roles: [ROLES.STUDENT],
    link: "/student/feedback",
  });

  await createAuditLog({
    actor: user,
    action: "feedback_cycle.created",
    entity: "FeedbackCycle",
    entityId: cycle._id,
    req,
  });

  return FeedbackCycle.findById(cycle._id).populate("department program section feedbackTemplate");
}

function isCycleAvailableForStudent(cycle, studentProfile) {
  if (!cycle || !studentProfile) {
    return false;
  }

  const matchesSection =
    cycle.section && String(cycle.section) === String(studentProfile.section?._id || studentProfile.section);
  const matchesDepartmentSemester =
    !cycle.section &&
    cycle.department &&
    String(cycle.department) === String(studentProfile.department?._id || studentProfile.department) &&
    cycle.semesterNumber === studentProfile.semesterNumber;
  const matchesDepartmentOnly =
    !cycle.section &&
    cycle.department &&
    !cycle.semesterNumber &&
    String(cycle.department) === String(studentProfile.department?._id || studentProfile.department);
  const hasNoSpecificScope = !cycle.section && !cycle.department && !cycle.semesterNumber;

  return matchesSection || matchesDepartmentSemester || matchesDepartmentOnly || hasNoSpecificScope;
}

export async function listCycles(query, user) {
  const filter = {};
  if (query.active) {
    filter.active = query.active === "true";
  }

  if (user.role === ROLES.STUDENT) {
    const profile = await loadUserProfile(user);
    filter.$or = [
      { section: profile?.section?._id },
      {
        department: profile?.department?._id,
        semesterNumber: profile?.semesterNumber,
      },
      { department: profile?.department?._id, section: null },
    ];
  }

  return FeedbackCycle.find(filter)
    .populate("department program section feedbackTemplate")
    .sort({ createdAt: -1 });
}

export async function getEligibleFaculty(user) {
  const profile = await loadUserProfile(user);
  if (!profile?._id) {
    throw new ApiError(403, "Only students can access feedback targets.");
  }

  const assignments = await FacultyAssignment.find({
    section: profile.section._id,
    semesterNumber: profile.semesterNumber,
  })
    .populate({
      path: "faculty",
      populate: "user department",
    })
    .populate("subject");

  return assignments.map((assignment) => ({
    assignmentId: assignment._id,
    facultyId: assignment.faculty._id,
    facultyName: assignment.faculty.user.fullName,
    subjectId: assignment.subject._id,
    subjectName: assignment.subject.name,
    subjectCode: assignment.subject.code,
  }));
}

export async function submitFeedback(payload, user, req) {
  const studentProfile = await loadUserProfile(user);
  if (!studentProfile?._id) {
    throw new ApiError(403, "Only students can submit feedback.");
  }

  const cycle = await FeedbackCycle.findById(payload.cycleId).populate("feedbackTemplate");
  if (!cycle || !cycle.active) {
    throw new ApiError(400, "Feedback cycle is not active.");
  }
  if (!isCycleAvailableForStudent(cycle, studentProfile)) {
    throw new ApiError(403, "This feedback cycle is not assigned to your academic mapping.");
  }

  const faculty = await FacultyProfile.findById(payload.facultyId).populate("user");
  if (!faculty) {
    throw new ApiError(404, "Faculty not found.");
  }

  const assignment = await FacultyAssignment.findOne({
    faculty: faculty._id,
    subject: payload.subjectId,
    section: studentProfile.section._id,
    semesterNumber: studentProfile.semesterNumber,
  });

  if (!assignment) {
    throw new ApiError(400, "The selected faculty and subject are not assigned to your section.");
  }

  const existingSubmission = await FeedbackSubmission.findOne({
    cycle: cycle._id,
    student: studentProfile._id,
    faculty: faculty._id,
    section: studentProfile.section._id,
  });

  if (existingSubmission) {
    throw new ApiError(409, "You have already submitted feedback for this faculty in the selected cycle.");
  }

  const numericScores = payload.responses
    .map((response) => response.score)
    .filter((value) => typeof value === "number");
  const averageRating = numericScores.length
    ? Number((numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length).toFixed(2))
    : 0;

  const submission = await FeedbackSubmission.create({
    cycle: cycle._id,
    template: cycle.feedbackTemplate._id,
    student: studentProfile._id,
    faculty: faculty._id,
    subject: payload.subjectId,
    section: studentProfile.section._id,
    responses: payload.responses,
    averageRating,
    strengths: payload.strengths,
    areasToImprove: payload.areasToImprove,
    additionalComments: payload.additionalComments,
    isAnonymous: payload.isAnonymous,
  });

  await Notification.create({
    title: "New faculty feedback submitted",
    message: `A feedback response was submitted for ${faculty.user.fullName}.`,
    audience: "role",
    roles: [ROLES.ADMIN],
    link: `/admin/feedback/submissions/${submission._id}`,
  });

  await createAuditLog({
    actor: user,
    action: "feedback.submitted",
    entity: "FeedbackSubmission",
    entityId: submission._id,
    req,
  });

  return submission;
}

export async function listFeedbackSubmissions(query, user) {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can review feedback results.");
  }

  const filter = {};
  if (query.cycleId) {
    filter.cycle = query.cycleId;
  }
  if (query.facultyId) {
    filter.faculty = query.facultyId;
  }

  return FeedbackSubmission.find(filter)
    .populate("cycle template student faculty subject section")
    .sort({ createdAt: -1 });
}

export async function getFeedbackAnalytics(query) {
  const filter = {};
  if (query.cycleId) {
    filter.cycle = query.cycleId;
  }
  if (query.facultyId) {
    filter.faculty = query.facultyId;
  }

  const submissions = await FeedbackSubmission.find(filter)
    .populate({
      path: "faculty",
      populate: "user",
    })
    .populate("subject section cycle");

  const facultySummary = Object.values(
    submissions.reduce((acc, submission) => {
      const key = String(submission.faculty._id);
      acc[key] = acc[key] || {
        facultyId: submission.faculty._id,
        facultyName: submission.faculty.user.fullName,
        averageRating: 0,
        totalSubmissions: 0,
      };
      acc[key].averageRating += submission.averageRating;
      acc[key].totalSubmissions += 1;
      acc[key].averageRating = Number(
        (acc[key].averageRating / acc[key].totalSubmissions).toFixed(2),
      );
      return acc;
    }, {}),
  );

  return {
    totalSubmissions: submissions.length,
    facultySummary,
    submissions,
  };
}
