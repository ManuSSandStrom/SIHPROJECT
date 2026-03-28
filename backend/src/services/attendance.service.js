import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import {
  AUDIT_ACTIONS,
  DEFAULT_ATTENDANCE_THRESHOLDS,
  ROLES,
} from "../constants/app.js";
import {
  AttendanceOverrideLog,
  AttendanceRecord,
  AttendanceSession,
  FacultyProfile,
  Holiday,
  Section,
  StudentProfile,
  TimetableEntry,
} from "../models/index.js";
import { ApiError } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";
import { loadUserProfile } from "../utils/profile.js";

async function ensureFacultyAccess(user, facultyId) {
  if (user.role === ROLES.ADMIN) {
    return facultyId;
  }

  const facultyProfile = await FacultyProfile.findOne({ user: user._id });
  if (!facultyProfile) {
    throw new ApiError(403, "Faculty profile not found.");
  }

  return facultyProfile._id;
}

export async function createAttendanceSession(payload, user) {
  const date = typeof payload.date === "string" ? parseISO(payload.date) : payload.date;
  const holiday = await Holiday.findOne({ date });

  if (holiday && holiday.fullAttendance) {
    throw new ApiError(400, "This date is a full-attendance holiday. Manual session creation is blocked.");
  }

  const facultyId = await ensureFacultyAccess(user, payload.facultyId);

  const session = await AttendanceSession.findOneAndUpdate(
    {
      section: payload.sectionId,
      subject: payload.subjectId,
      date,
      periodNumber: payload.periodNumber,
    },
    {
      section: payload.sectionId,
      subject: payload.subjectId,
      faculty: facultyId,
      timetableEntry: payload.timetableEntryId,
      date,
      day: payload.day,
      periodNumber: payload.periodNumber,
      markedBy: user._id,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  ).populate("section subject faculty timetableEntry");

  return session;
}

export async function submitAttendance(payload, user, req) {
  const session = await AttendanceSession.findById(payload.sessionId)
    .populate("section subject faculty");

  if (!session) {
    throw new ApiError(404, "Attendance session not found.");
  }

  if (session.status === "frozen") {
    throw new ApiError(400, "Attendance session is frozen.");
  }

  if (user.role === ROLES.FACULTY) {
    const facultyProfile = await FacultyProfile.findOne({ user: user._id });
    if (!facultyProfile || String(session.faculty._id) !== String(facultyProfile._id)) {
      throw new ApiError(403, "You can only submit attendance for your assigned session.");
    }
  }

  const studentIds = payload.records.map((record) => record.studentId);
  const students = await StudentProfile.find({
    _id: { $in: studentIds },
    section: session.section._id,
  });

  if (students.length !== studentIds.length) {
    throw new ApiError(400, "One or more students do not belong to this section.");
  }

  await Promise.all(
    payload.records.map((record) =>
      AttendanceRecord.findOneAndUpdate(
        {
          session: session._id,
          student: record.studentId,
        },
        {
          session: session._id,
          student: record.studentId,
          status: record.status,
          remarks: record.remarks,
          markedBy: user._id,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      ),
    ),
  );

  session.status = "submitted";
  session.submittedAt = new Date();
  session.markedBy = user._id;
  await session.save();

  await createAuditLog({
    actor: user,
    action: AUDIT_ACTIONS.ATTENDANCE_SUBMITTED,
    entity: "AttendanceSession",
    entityId: session._id,
    metadata: { totalStudents: payload.records.length },
    req,
  });

  return AttendanceSession.findById(session._id)
    .populate("section subject faculty markedBy");
}

export async function overrideAttendance(sessionId, studentId, payload, user, req) {
  const record = await AttendanceRecord.findOne({
    session: sessionId,
    student: studentId,
  });

  if (!record) {
    throw new ApiError(404, "Attendance record not found.");
  }

  await AttendanceOverrideLog.create({
    session: sessionId,
    student: studentId,
    previousStatus: record.status,
    newStatus: payload.status,
    reason: payload.reason,
    changedBy: user._id,
  });

  record.status = payload.status;
  await record.save();

  await createAuditLog({
    actor: user,
    action: AUDIT_ACTIONS.ATTENDANCE_OVERRIDDEN,
    entity: "AttendanceRecord",
    entityId: record._id,
    metadata: { studentId, reason: payload.reason },
    req,
  });

  return record;
}

export async function listAttendanceSessions(query, user) {
  const filter = {};

  if (query.sectionId) {
    filter.section = query.sectionId;
  }
  if (query.date) {
    filter.date = parseISO(query.date);
  }

  if (user.role === ROLES.FACULTY) {
    const faculty = await FacultyProfile.findOne({ user: user._id });
    filter.faculty = faculty?._id;
  }

  if (user.role === ROLES.STUDENT) {
    const profile = await loadUserProfile(user);
    filter.section = profile?.section?._id;
  }

  return AttendanceSession.find(filter)
    .populate("section subject faculty timetableEntry markedBy")
    .sort({ date: -1, periodNumber: 1 });
}

export async function getStudentAttendanceDashboard(user) {
  const profile = await loadUserProfile(user);
  if (!profile?._id) {
    throw new ApiError(404, "Student profile not found.");
  }

  const records = await AttendanceRecord.find({ student: profile._id })
    .populate({
      path: "session",
      populate: ["subject", "section"],
    });

  const total = records.length;
  const attended = records.filter((record) => ["present", "late", "excused"].includes(record.status)).length;
  const overallPercentage = total ? Number(((attended / total) * 100).toFixed(1)) : 0;

  const subjectWise = records.reduce((acc, record) => {
    const subject = record.session?.subject;
    if (!subject) {
      return acc;
    }
    const key = subject.code;
    acc[key] = acc[key] || { subjectCode: subject.code, subjectName: subject.name, total: 0, attended: 0 };
    acc[key].total += 1;
    acc[key].attended += ["present", "late", "excused"].includes(record.status) ? 1 : 0;
    acc[key].percentage = Number(((acc[key].attended / acc[key].total) * 100).toFixed(1));
    return acc;
  }, {});

  return {
    overallPercentage,
    thresholds: DEFAULT_ATTENDANCE_THRESHOLDS,
    shortageBand:
      overallPercentage < DEFAULT_ATTENDANCE_THRESHOLDS.critical
        ? "critical"
        : overallPercentage < DEFAULT_ATTENDANCE_THRESHOLDS.danger
          ? "danger"
          : overallPercentage < DEFAULT_ATTENDANCE_THRESHOLDS.warning
            ? "warning"
            : "healthy",
    totalClasses: total,
    attendedClasses: attended,
    subjectWise: Object.values(subjectWise),
    records,
  };
}

export async function getAttendanceAnalytics(query) {
  const filter = {};
  if (query.sectionId) {
    filter.section = query.sectionId;
  }

  const sessions = await AttendanceSession.find(filter).select("_id section subject date periodNumber");
  const sessionIds = sessions.map((session) => session._id);
  const records = await AttendanceRecord.find({ session: { $in: sessionIds } })
    .populate("student session");

  const dailyAbsentees = records
    .filter((record) => record.status === "absent")
    .map((record) => ({
      studentId: record.student?._id,
      sessionId: record.session?._id,
      date: record.session?.date,
    }));

  return {
    totalSessions: sessions.length,
    totalRecords: records.length,
    dailyAbsentees,
  };
}

export async function getMonthlyAttendanceReport(sectionId, month) {
  const monthDate = parseISO(`${month}-01`);
  const records = await AttendanceRecord.find()
    .populate({
      path: "session",
      match: {
        section: sectionId,
        date: {
          $gte: startOfMonth(monthDate),
          $lte: endOfMonth(monthDate),
        },
      },
      populate: ["section", "subject"],
    })
    .populate("student");

  const filtered = records.filter((record) => record.session);
  return filtered.map((record) => ({
    student: record.student?.collegeId || record.student?._id,
    date: format(record.session.date, "yyyy-MM-dd"),
    subject: record.session.subject?.code,
    period: record.session.periodNumber,
    status: record.status,
  }));
}

export async function getSectionRoster(sectionId) {
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new ApiError(404, "Section not found.");
  }

  return StudentProfile.find({ section: sectionId })
    .populate("user section")
    .sort({ collegeId: 1 });
}

export async function getTodayFacultyPeriods(user, dateString) {
  const faculty = await FacultyProfile.findOne({ user: user._id });
  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found.");
  }

  const date = dateString ? parseISO(dateString) : new Date();
  const day = format(date, "EEEE");
  return TimetableEntry.find({ faculty: faculty._id, day })
    .populate({
      path: "timetable",
      match: { status: "published" },
    })
    .populate("section subject classroom laboratory")
    .sort({ periodNumber: 1 })
    .then((entries) => entries.filter((entry) => entry.timetable));
}
