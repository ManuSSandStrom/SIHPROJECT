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
  Classroom,
  ContactMessage,
  Department,
  FacultyProfile,
  FacultyAssignment,
  FeedbackCycle,
  FeedbackSubmission,
  Issue,
  Laboratory,
  Notification,
  Program,
  Section,
  Semester,
  StudentProfile,
  Subject,
  Timetable,
  User,
  AdminProfile,
  Holiday,
  FeedbackTemplate,
  AuditLog,
} from "../models/index.js";
import { ApiError, buildPagination, getSort } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";
import { hashPassword } from "../utils/security.js";

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

async function ensureDepartmentProgramContext(departmentId, programId) {
  const [department, program] = await Promise.all([
    Department.findById(departmentId),
    Program.findById(programId),
  ]);

  if (!department || !program) {
    throw new ApiError(400, "Invalid department or program.");
  }

  if (String(program.department) !== String(department._id)) {
    throw new ApiError(400, "Selected program does not belong to the chosen department.");
  }

  return { department, program };
}

async function resolveSection({
  sectionId,
  departmentId,
  programId,
  semesterNumber,
  batchYear,
  sectionName,
}) {
  if (sectionId) {
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError(404, "Section not found.");
    }
    return section;
  }

  if (!sectionName) {
    throw new ApiError(400, "Section name is required.");
  }

  const normalizedCode = sectionName.trim().toUpperCase();
  const existingSection = await Section.findOne({
    department: departmentId,
    program: programId,
    semesterNumber,
    code: normalizedCode,
  });

  if (existingSection) {
    return existingSection;
  }

  return Section.create({
    name: `Section ${normalizedCode}`,
    code: normalizedCode,
    department: departmentId,
    program: programId,
    semesterNumber,
    batchYear,
    strength: 60,
  });
}

async function createStudentResource(payload) {
  const requiredFields = [
    "fullName",
    "email",
    "password",
    "collegeId",
    "department",
    "program",
    "semesterNumber",
    "batchYear",
  ];
  const missingField = requiredFields.find((field) => !payload[field]);
  if (missingField) {
    throw new ApiError(400, `${missingField} is required to create a student.`);
  }

  const normalizedEmail = payload.email.toLowerCase();
  const normalizedCollegeId = payload.collegeId.toUpperCase();
  const [existingEmail, existingCollegeId] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    StudentProfile.findOne({ collegeId: normalizedCollegeId }),
  ]);

  if (existingEmail) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existingCollegeId) {
    throw new ApiError(409, "College ID is already registered.");
  }

  await ensureDepartmentProgramContext(payload.department, payload.program);
  const section = await resolveSection({
    sectionId: payload.section,
    departmentId: payload.department,
    programId: payload.program,
    semesterNumber: payload.semesterNumber,
    batchYear: payload.batchYear,
    sectionName: payload.sectionName,
  });

  const user = await User.create({
    fullName: payload.fullName,
    email: normalizedEmail,
    passwordHash: await hashPassword(payload.password),
    role: ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE,
    phone: payload.phone,
  });

  return StudentProfile.create({
    user: user._id,
    collegeId: normalizedCollegeId,
    rollNumber: payload.rollNumber?.toUpperCase(),
    department: payload.department,
    program: payload.program,
    semesterNumber: payload.semesterNumber,
    section: section._id,
    batchYear: payload.batchYear,
    emergencyContact: payload.emergencyContact,
  });
}

async function createFacultyResource(payload) {
  const requiredFields = [
    "fullName",
    "email",
    "password",
    "staffId",
    "department",
  ];
  const missingField = requiredFields.find((field) => !payload[field]);
  if (missingField) {
    throw new ApiError(400, `${missingField} is required to create a faculty record.`);
  }

  const normalizedEmail = payload.email.toLowerCase();
  const normalizedStaffId = payload.staffId.toUpperCase();
  const [existingEmail, existingStaffId, department] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    FacultyProfile.findOne({ staffId: normalizedStaffId }),
    Department.findById(payload.department),
  ]);

  if (existingEmail) {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existingStaffId) {
    throw new ApiError(409, "Faculty staff ID is already registered.");
  }

  if (!department) {
    throw new ApiError(400, "Invalid department selected.");
  }

  const user = await User.create({
    fullName: payload.fullName,
    email: normalizedEmail,
    passwordHash: await hashPassword(payload.password),
    role: ROLES.FACULTY,
    status: USER_STATUSES.ACTIVE,
    phone: payload.phone,
  });

  return FacultyProfile.create({
    user: user._id,
    staffId: normalizedStaffId,
    qualification: payload.qualification,
    department: payload.department,
    phone: payload.phone,
    specialization: payload.specialization || [],
    assignedSections: payload.assignedSections || [],
    maxWeeklyLoad: payload.maxWeeklyLoad || 20,
    approvedAt: new Date(),
    approvedBy: payload.approvedBy,
  });
}

async function createAssignmentResource(payload) {
  const faculty = await FacultyProfile.findById(payload.faculty);
  const subject = await Subject.findById(payload.subject);
  const section = await Section.findById(payload.section);

  if (!faculty || !subject || !section) {
    throw new ApiError(400, "Faculty, subject, and section are required for an assignment.");
  }

  if (String(subject.department) !== String(section.department)) {
    throw new ApiError(400, "Selected subject does not belong to the section's department.");
  }

  if (String(subject.program) !== String(section.program)) {
    throw new ApiError(400, "Selected subject does not belong to the section's program.");
  }

  if (subject.semesterNumber !== section.semesterNumber) {
    throw new ApiError(400, "Selected subject does not belong to the section's semester.");
  }

  return FacultyAssignment.create({
    faculty: faculty._id,
    subject: subject._id,
    department: section.department,
    program: section.program,
    section: section._id,
    semesterNumber: section.semesterNumber,
    weeklyHoursOverride: payload.weeklyHoursOverride,
    preferredRoomType: payload.preferredRoomType || "classroom",
  });
}

async function createProgramResource(payload) {
  if (!payload.department) {
    throw new ApiError(400, "Department is required for a program.");
  }
  const department = await Department.findById(payload.department);
  if (!department) {
    throw new ApiError(400, "Invalid department selected.");
  }
  return Program.create(payload);
}

async function createSectionResource(payload) {
  if (!payload.department || !payload.program) {
    throw new ApiError(400, "Department and program are required for a section.");
  }
  await ensureDepartmentProgramContext(payload.department, payload.program);
  return Section.create(payload);
}

async function createSubjectResource(payload) {
  if (!payload.department || !payload.program) {
    throw new ApiError(400, "Department and program are required for a subject.");
  }
  await ensureDepartmentProgramContext(payload.department, payload.program);
  return Subject.create(payload);
}

async function createMasterResource(resource, payload, actor) {
  switch (resource) {
    case "students":
      return createStudentResource(payload);
    case "faculty":
      return createFacultyResource({ ...payload, approvedBy: actor._id });
    case "assignments":
      return createAssignmentResource(payload);
    case "programs":
      return createProgramResource(payload);
    case "sections":
      return createSectionResource(payload);
    case "subjects":
      return createSubjectResource(payload);
    default:
      return null;
  }
}

export async function getAdminSetupOptions() {
  const [
    departments,
    programs,
    semesters,
    sections,
    subjects,
    faculty,
    students,
    classrooms,
    laboratories,
    assignments,
    assignmentsCount,
  ] = await Promise.all([
    Department.find({ active: true }).sort({ name: 1 }),
    Program.find({ active: true }).populate("department").sort({ name: 1 }),
    Semester.find({}).populate("program").sort({ number: 1 }),
    Section.find({}).populate("department program adviser").sort({ batchYear: -1, semesterNumber: 1, code: 1 }),
    Subject.find({ active: true }).populate("department program").sort({ semesterNumber: 1, name: 1 }),
    FacultyProfile.find({}).populate("user department assignedSections").sort({ createdAt: -1 }),
    StudentProfile.find({}).populate("user department program section").sort({ createdAt: -1 }),
    Classroom.find({ active: true }).sort({ building: 1, name: 1 }),
    Laboratory.find({ active: true }).sort({ building: 1, name: 1 }),
    FacultyAssignment.find({}).populate("faculty subject section"),
    FacultyAssignment.countDocuments(),
  ]);

  const sectionReadiness = sections.map((section) => {
    const subjectCount = subjects.filter(
      (subject) =>
        String(subject.program?._id || subject.program) === String(section.program?._id || section.program) &&
        subject.semesterNumber === section.semesterNumber,
    ).length;
    const sectionAssignments = assignments.filter(
      (assignment) => String(assignment.section?._id || assignment.section) === String(section._id),
    );
    const facultyCount = new Set(
      sectionAssignments.map((assignment) => String(assignment.faculty?._id || assignment.faculty)),
    ).size;
    const studentCount = students.filter(
      (student) => String(student.section?._id || student.section) === String(section._id),
    ).length;

    return {
      _id: String(section._id),
      label: `${section.program?.name || "Program"} Semester ${section.semesterNumber} - ${section.name}`,
      subjectCount,
      facultyCount,
      assignmentCount: sectionAssignments.length,
      studentCount,
    };
  });

  return {
    departments,
    programs,
    semesters,
    sections,
    subjects,
    faculty,
    students,
    classrooms,
    laboratories,
    readiness: {
      departments: departments.length,
      programs: programs.length,
      semesters: semesters.length,
      sections: sections.length,
      subjects: subjects.length,
      faculty: faculty.length,
      students: students.length,
      rooms: classrooms.length + laboratories.length,
      assignments: assignmentsCount,
    },
    sectionReadiness,
  };
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
  const created = (await createMasterResource(resource, payload, actor)) || (await model.create(payload));

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
