import {
  AUDIT_ACTIONS,
  DEFAULT_ATTENDANCE_THRESHOLDS,
  MASTER_DATA_RESOURCES,
  ROLES,
  USER_STATUSES,
} from "../constants/app.js";
import {
  AttendanceRecord,
  AttendanceSession,
  ContactMessage,
  Department,
  FacultyProfile,
  FeedbackCycle,
  FeedbackSubmission,
  Issue,
  Notification,
  Section,
  StudentProfile,
  Timetable,
  User,
  AdminProfile,
  Program,
  Semester,
  Subject,
  FacultyAssignment,
  Classroom,
  Laboratory,
  Holiday,
  FeedbackTemplate,
  AuditLog,
} from "../models/index.js";
import { ApiError, buildPagination, getSort } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";

const resourceMap = {
  [MASTER_DATA_RESOURCES.departments]: Department,
  [MASTER_DATA_RESOURCES.programs]: Program,
  [MASTER_DATA_RESOURCES.semesters]: Semester,
  [MASTER_DATA_RESOURCES.sections]: Section,
  [MASTER_DATA_RESOURCES.subjects]: Subject,
  [MASTER_DATA_RESOURCES.classrooms]: Classroom,
  [MASTER_DATA_RESOURCES.laboratories]: Laboratory,
  [MASTER_DATA_RESOURCES.assignments]: FacultyAssignment,
  [MASTER_DATA_RESOURCES.students]: StudentProfile,
  [MASTER_DATA_RESOURCES.faculty]: FacultyProfile,
  [MASTER_DATA_RESOURCES.holidays]: Holiday,
  [MASTER_DATA_RESOURCES.templates]: FeedbackTemplate,
  [MASTER_DATA_RESOURCES.cycles]: FeedbackCycle,
};

const resourcePopulate = {
  Department: "",
  Program: "department",
  Semester: "program",
  Section: "department program adviser",
  Subject: "department program",
  FacultyAssignment: "faculty subject department program section",
  StudentProfile: "user department program section",
  FacultyProfile: "user department assignedSections approvedBy",
  Holiday: "department section",
  FeedbackTemplate: "",
  FeedbackCycle: "department program section feedbackTemplate",
};

function resolveResource(resource) {
  const modelName = MASTER_DATA_RESOURCES[resource];
  const model = resourceMap[modelName];

  if (!model) {
    throw new ApiError(404, "Unsupported master data resource.");
  }

  return { model, modelName };
}

export async function getAdminDashboard() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalFaculty,
    pendingFacultyApprovals,
    departmentsCount,
    sectionsCount,
    openIssues,
    solvedIssues,
    activeFeedbackCycles,
    timetablePublished,
    todayAttendance,
    todayAbsentees,
  ] = await Promise.all([
    StudentProfile.countDocuments(),
    FacultyProfile.countDocuments(),
    User.countDocuments({ role: ROLES.FACULTY, status: USER_STATUSES.PENDING }),
    Department.countDocuments({ active: true }),
    Section.countDocuments(),
    Issue.countDocuments({ status: { $in: ["received", "under_review", "in_progress"] } }),
    Issue.countDocuments({ status: "solved" }),
    FeedbackCycle.countDocuments({ active: true }),
    Timetable.countDocuments({ status: "published" }),
    AttendanceRecord.aggregate([
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      { $match: { "session.date": { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    AttendanceRecord.aggregate([
      {
        $lookup: {
          from: "attendancesessions",
          localField: "session",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      { $match: { "session.date": { $gte: todayStart }, status: "absent" } },
      { $count: "total" },
    ]),
  ]);

  const attendanceStats = todayAttendance[0] || { total: 0, present: 0 };

  const issueTrend = await Issue.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const feedbackTrend = await FeedbackSubmission.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        },
        averageRating: { $avg: "$averageRating" },
        submissions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    stats: {
      totalStudents,
      totalFaculty,
      pendingFacultyApprovals,
      departmentsCount,
      sectionsCount,
      todayAttendancePercentage: attendanceStats.total
        ? Number(((attendanceStats.present / attendanceStats.total) * 100).toFixed(1))
        : 0,
      todayAbsentees: todayAbsentees[0]?.total || 0,
      openIssues,
      solvedIssues,
      activeFeedbackCycles,
      timetablePublished,
    },
    thresholds: DEFAULT_ATTENDANCE_THRESHOLDS,
    charts: {
      issueTrend,
      feedbackTrend,
    },
  };
}

export async function listResource(resource, query) {
  const { model, modelName } = resolveResource(resource);
  const { skip, limit, page } = buildPagination(query);
  const filter = {};

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { code: { $regex: query.search, $options: "i" } },
      { title: { $regex: query.search, $options: "i" } },
      { staffId: { $regex: query.search, $options: "i" } },
      { collegeId: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    model.find(filter)
      .populate(resourcePopulate[modelName])
      .sort(getSort(query))
      .skip(skip)
      .limit(limit),
    model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createResource(resource, payload, actor, req) {
  const { model, modelName } = resolveResource(resource);
  const created = await model.create(payload);

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.MASTER_DATA_CHANGED,
    entity: modelName,
    entityId: created._id,
    metadata: { mode: "create" },
    req,
  });

  return model.findById(created._id).populate(resourcePopulate[modelName]);
}

export async function updateResource(resource, id, payload, actor, req) {
  const { model, modelName } = resolveResource(resource);
  const updated = await model.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate(resourcePopulate[modelName]);

  if (!updated) {
    throw new ApiError(404, "Record not found.");
  }

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.MASTER_DATA_CHANGED,
    entity: modelName,
    entityId: updated._id,
    metadata: { mode: "update" },
    req,
  });

  return updated;
}

export async function deleteResource(resource, id, actor, req) {
  const { model, modelName } = resolveResource(resource);
  const deleted = await model.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "Record not found.");
  }

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.MASTER_DATA_CHANGED,
    entity: modelName,
    entityId: id,
    metadata: { mode: "delete" },
    req,
  });

  return { acknowledged: true };
}

export async function bulkImportResource(resource, rows, actor, req) {
  const { model, modelName } = resolveResource(resource);
  const created = await model.insertMany(rows, { ordered: false });

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.MASTER_DATA_CHANGED,
    entity: modelName,
    metadata: { mode: "bulk_import", total: created.length },
    req,
  });

  return created;
}

export async function listPendingFaculty() {
  return FacultyProfile.find()
    .populate({
      path: "user",
      match: { role: ROLES.FACULTY, status: USER_STATUSES.PENDING },
    })
    .populate("department assignedSections")
    .then((rows) => rows.filter((row) => row.user));
}

export async function approveFaculty(userId, actor, req) {
  const user = await User.findOneAndUpdate(
    { _id: userId, role: ROLES.FACULTY },
    { status: USER_STATUSES.ACTIVE },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "Faculty user not found.");
  }

  await FacultyProfile.findOneAndUpdate(
    { user: user._id },
    {
      approvedAt: new Date(),
      approvedBy: actor._id,
    },
  );

  await Notification.create({
    title: "Faculty access approved",
    message: "Your faculty account is now active. You can log in to manage attendance and timetable access.",
    audience: "user",
    user: user._id,
  });

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.FACULTY_APPROVED,
    entity: "User",
    entityId: user._id,
    req,
  });

  return user;
}

export async function rejectFaculty(userId, reason, actor, req) {
  const user = await User.findOneAndUpdate(
    { _id: userId, role: ROLES.FACULTY },
    { status: USER_STATUSES.REJECTED },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "Faculty user not found.");
  }

  await Notification.create({
    title: "Faculty access request reviewed",
    message: `Your access request was rejected${reason ? `: ${reason}` : "."}`,
    audience: "user",
    user: user._id,
  });

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.FACULTY_REJECTED,
    entity: "User",
    entityId: user._id,
    metadata: { reason },
    req,
  });

  return user;
}

export async function listContactMessages(query) {
  const { skip, limit, page } = buildPagination(query);
  const filter = query.status ? { status: query.status } : {};
  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort(getSort(query)).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function updateContactMessage(id, payload) {
  const updated = await ContactMessage.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new ApiError(404, "Contact message not found.");
  }

  return updated;
}

export async function listAuditLogs(query) {
  const { skip, limit, page } = buildPagination(query);
  const [items, total] = await Promise.all([
    AuditLog.find({})
      .populate("actor", "fullName email role")
      .sort(getSort(query))
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
