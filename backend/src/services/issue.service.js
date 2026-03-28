import { ROLES } from "../constants/app.js";
import {
  Issue,
  IssueReply,
  Notification,
} from "../models/index.js";
import { ApiError } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";
import { loadUserProfile } from "../utils/profile.js";

export async function createIssue(payload, user, req) {
  const studentProfile = await loadUserProfile(user);
  if (!studentProfile?._id) {
    throw new ApiError(403, "Only students can raise issues.");
  }

  const issue = await Issue.create({
    student: studentProfile._id,
    department: studentProfile.department._id,
    section: studentProfile.section._id,
    category: payload.category,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    confidential: payload.confidential,
    attachmentUrl: payload.attachmentUrl || undefined,
  });

  await Notification.create({
    title: "New student issue",
    message: `${user.fullName} raised a ${payload.category.replaceAll("_", " ")} ticket.`,
    audience: "role",
    roles: [ROLES.ADMIN],
    link: `/admin/issues/${issue._id}`,
  });

  await createAuditLog({
    actor: user,
    action: "issue.created",
    entity: "Issue",
    entityId: issue._id,
    req,
  });

  return Issue.findById(issue._id)
    .populate({
      path: "student",
      populate: ["user", "department", "section"],
    })
    .populate("department section");
}

export async function listIssues(query, user) {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.sectionId) {
    filter.section = query.sectionId;
  }

  if (user.role === ROLES.STUDENT) {
    const profile = await loadUserProfile(user);
    filter.student = profile?._id;
  }

  return Issue.find(filter)
    .populate({
      path: "student",
      populate: ["user", "department", "section"],
    })
    .populate("department section")
    .sort({ updatedAt: -1 });
}

export async function getIssueById(issueId, user) {
  const issue = await Issue.findById(issueId)
    .populate({
      path: "student",
      populate: ["user", "department", "section"],
    })
    .populate("department section");

  if (!issue) {
    throw new ApiError(404, "Issue not found.");
  }

  if (user.role === ROLES.STUDENT) {
    const profile = await loadUserProfile(user);
    if (String(issue.student._id) !== String(profile?._id)) {
      throw new ApiError(403, "You cannot access another student's issue.");
    }
  }

  const replies = await IssueReply.find({ issue: issue._id })
    .populate("user", "fullName email role")
    .sort({ createdAt: 1 });

  return {
    issue,
    replies:
      user.role === ROLES.ADMIN
        ? replies
        : replies.filter((reply) => !reply.internal && reply.visibility !== "private"),
  };
}

export async function replyToIssue(issueId, payload, user, req) {
  const issue = await Issue.findById(issueId)
    .populate({
      path: "student",
      populate: "user",
    });

  if (!issue) {
    throw new ApiError(404, "Issue not found.");
  }

  if (user.role === ROLES.STUDENT) {
    const profile = await loadUserProfile(user);
    if (String(issue.student._id) !== String(profile?._id)) {
      throw new ApiError(403, "You cannot reply to another student's issue.");
    }
  }

  const reply = await IssueReply.create({
    issue: issue._id,
    user: user._id,
    message: payload.message,
    internal: user.role === ROLES.ADMIN ? payload.internal : false,
    visibility: user.role === ROLES.ADMIN ? payload.visibility : "public",
  });

  issue.lastReplyAt = new Date();
  if (user.role === ROLES.ADMIN && issue.status === "received") {
    issue.status = "under_review";
  }
  await issue.save();

  if (user.role === ROLES.ADMIN) {
    await Notification.create({
      title: "Issue updated",
      message: `Your issue "${issue.title}" has a new reply from admin.`,
      audience: "user",
      user: issue.student.user._id,
      link: `/student/issues/${issue._id}`,
    });
  }

  await createAuditLog({
    actor: user,
    action: "issue.reply_created",
    entity: "IssueReply",
    entityId: reply._id,
    metadata: { issueId: issue._id },
    req,
  });

  return reply.populate("user", "fullName email role");
}

export async function updateIssue(issueId, payload, user, req) {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can update issue workflow state.");
  }

  const issue = await Issue.findByIdAndUpdate(
    issueId,
    payload,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate({
      path: "student",
      populate: "user",
    })
    .populate("department section");

  if (!issue) {
    throw new ApiError(404, "Issue not found.");
  }

  await Notification.create({
    title: "Issue status updated",
    message: `Your issue "${issue.title}" is now ${issue.status.replaceAll("_", " ")}.`,
    audience: "user",
    user: issue.student.user._id,
    link: `/student/issues/${issue._id}`,
  });

  await createAuditLog({
    actor: user,
    action: "issue.updated",
    entity: "Issue",
    entityId: issue._id,
    metadata: payload,
    req,
  });

  return issue;
}
