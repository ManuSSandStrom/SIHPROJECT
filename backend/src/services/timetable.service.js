import { addMinutes, format, parse } from "date-fns";
import {
  AUDIT_ACTIONS,
  DAYS_OF_WEEK,
  DEFAULT_TIMETABLE_CONFIG,
  OPTIONAL_DAY,
  ROLES,
} from "../constants/app.js";
import {
  Classroom,
  FacultyAssignment,
  FacultyProfile,
  Laboratory,
  Section,
  Subject,
  Timetable,
  TimetableEntry,
} from "../models/index.js";
import { ApiError } from "../utils/api.js";
import { createAuditLog } from "../utils/audit.js";

function getDays(includeSunday) {
  return includeSunday ? [...DAYS_OF_WEEK, OPTIONAL_DAY] : [...DAYS_OF_WEEK];
}

function buildPeriods(config) {
  const periods = [];
  let cursor = parse(config.dayStartTime, "HH:mm", new Date());

  for (let periodNumber = 1; periodNumber <= config.periodsPerDay; periodNumber += 1) {
    const start = cursor;
    const end = addMinutes(cursor, config.periodDurationMinutes);
    periods.push({
      periodNumber,
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
    });
    cursor = end;

    if (periodNumber === config.lunchAfterPeriod) {
      cursor = addMinutes(cursor, config.lunchDurationMinutes);
    }
  }

  return periods;
}

function scoreSlot({ day, periodNumber, demand, scheduleMap, facultyDayCounts, subjectDayCounts }) {
  const facultyKey = String(demand.faculty._id);
  const subjectKey = String(demand.subject._id);
  const facultyLoads = facultyDayCounts[facultyKey] || {};
  const subjectLoads = subjectDayCounts[subjectKey] || {};

  let score = 100;
  score -= (facultyLoads[day] || 0) * 5;
  score -= (subjectLoads[day] || 0) * 15;
  score -= periodNumber * 0.5;

  const sameDayEntries = Array.from(scheduleMap.values()).filter(
    (entry) =>
      entry.day === day &&
      String(entry.subject) === String(demand.subject._id),
  );

  if (sameDayEntries.length === 0) {
    score += 20;
  }

  if (sameDayEntries.some((entry) => Math.abs(entry.periodNumber - periodNumber) <= 1)) {
    score -= 18;
  }

  return score;
}

function makeSlotKey(day, periodNumber) {
  return `${day}-${periodNumber}`;
}

async function getSectionContext(sectionId) {
  const section = await Section.findById(sectionId).populate("department program adviser");

  if (!section) {
    throw new ApiError(404, "Section not found.");
  }

  const assignments = await FacultyAssignment.find({ section: section._id })
    .populate("faculty subject department program section");

  if (!assignments.length) {
    throw new ApiError(400, "No faculty-subject assignments found for the selected section.");
  }

  const classrooms = await Classroom.find({ active: true, capacity: { $gte: section.strength } }).sort({
    capacity: 1,
  });
  const laboratories = await Laboratory.find({ active: true, capacity: { $gte: section.strength } }).sort({
    capacity: 1,
  });

  return { section, assignments, classrooms, laboratories };
}

function expandDemands(assignments) {
  return assignments
    .flatMap((assignment) => {
      const subject = assignment.subject;
      const totalTheoryHours = assignment.weeklyHoursOverride ?? subject.weeklyHours ?? 3;
      const theorySessions = subject.type === "lab" ? 0 : totalTheoryHours;
      const labSessions = subject.labHours ? Math.ceil(subject.labHours / 2) : subject.type !== "theory" ? 1 : 0;

      return [
        ...Array.from({ length: theorySessions }).map(() => ({
          assignment,
          faculty: assignment.faculty,
          subject,
          isLab: false,
          span: 1,
        })),
        ...Array.from({ length: labSessions }).map(() => ({
          assignment,
          faculty: assignment.faculty,
          subject,
          isLab: true,
          span: 2,
        })),
      ];
    })
    .sort((a, b) => b.span - a.span || (b.subject.weeklyHours || 0) - (a.subject.weeklyHours || 0));
}

function pickRoom(demand, day, periodNumber, span, roomBusy, classrooms, laboratories) {
  const rooms = demand.isLab ? laboratories : classrooms;
  return rooms.find((room) => {
    for (let offset = 0; offset < span; offset += 1) {
      const roomKey = `${room._id}-${day}-${periodNumber + offset}`;
      if (roomBusy.has(roomKey)) {
        return false;
      }
    }
    return true;
  });
}

async function getNextVersion(sectionId) {
  const latest = await Timetable.findOne({ section: sectionId })
    .sort({ version: -1 })
    .select("version");
  return (latest?.version || 0) + 1;
}

export async function generateWeeklyTimetable(payload, actor, req) {
  const config = {
    ...DEFAULT_TIMETABLE_CONFIG,
    ...payload,
  };
  const { section, assignments, classrooms, laboratories } = await getSectionContext(payload.sectionId);
  const days = getDays(Boolean(config.includeSunday));
  const periods = buildPeriods(config);
  const demands = expandDemands(assignments);
  const facultyBusy = new Set();
  const roomBusy = new Set();
  const scheduleMap = new Map();
  const facultyDayCounts = {};
  const subjectDayCounts = {};
  const conflicts = [];

  for (const demand of demands) {
    let bestCandidate = null;

    for (const day of days) {
      for (const period of periods) {
        if (period.periodNumber + demand.span - 1 > periods.length) {
          continue;
        }

        const facultyLoad = facultyDayCounts[String(demand.faculty._id)] || {};
        if ((facultyLoad.total || 0) >= (demand.faculty.maxWeeklyLoad || 20)) {
          continue;
        }

        let conflict = false;
        for (let offset = 0; offset < demand.span; offset += 1) {
          const facultyKey = `${demand.faculty._id}-${day}-${period.periodNumber + offset}`;
          const sectionKey = makeSlotKey(day, period.periodNumber + offset);

          if (facultyBusy.has(facultyKey) || scheduleMap.has(sectionKey)) {
            conflict = true;
            break;
          }
        }

        if (conflict) {
          continue;
        }

        const room = pickRoom(
          demand,
          day,
          period.periodNumber,
          demand.span,
          roomBusy,
          classrooms,
          laboratories,
        );

        if (!room) {
          continue;
        }

        const slotScore = scoreSlot({
          day,
          periodNumber: period.periodNumber,
          demand,
          scheduleMap,
          facultyDayCounts,
          subjectDayCounts,
        });

        if (!bestCandidate || slotScore > bestCandidate.score) {
          bestCandidate = {
            day,
            room,
            period,
            score: slotScore,
          };
        }
      }
    }

    if (!bestCandidate) {
      conflicts.push({
        subject: demand.subject.name,
        reason: "No feasible slot",
        detail: `Unable to schedule ${demand.subject.code} for ${section.name} without room or faculty conflicts.`,
      });
      continue;
    }

    for (let offset = 0; offset < demand.span; offset += 1) {
      const currentPeriod = periods.find(
        (period) => period.periodNumber === bestCandidate.period.periodNumber + offset,
      );
      const sectionKey = makeSlotKey(bestCandidate.day, currentPeriod.periodNumber);
      scheduleMap.set(sectionKey, {
        day: bestCandidate.day,
        periodNumber: currentPeriod.periodNumber,
        startTime: currentPeriod.startTime,
        endTime: currentPeriod.endTime,
        subject: demand.subject._id,
        faculty: demand.faculty._id,
        classroom: demand.isLab ? undefined : bestCandidate.room._id,
        laboratory: demand.isLab ? bestCandidate.room._id : undefined,
        roomLabel: bestCandidate.room.name,
        isLab: demand.isLab,
        span: demand.span,
      });

      facultyBusy.add(`${demand.faculty._id}-${bestCandidate.day}-${currentPeriod.periodNumber}`);
      roomBusy.add(`${bestCandidate.room._id}-${bestCandidate.day}-${currentPeriod.periodNumber}`);
    }

    const facultyKey = String(demand.faculty._id);
    const subjectKey = String(demand.subject._id);
    facultyDayCounts[facultyKey] = facultyDayCounts[facultyKey] || { total: 0 };
    facultyDayCounts[facultyKey][bestCandidate.day] =
      (facultyDayCounts[facultyKey][bestCandidate.day] || 0) + demand.span;
    facultyDayCounts[facultyKey].total += demand.span;
    subjectDayCounts[subjectKey] = subjectDayCounts[subjectKey] || {};
    subjectDayCounts[subjectKey][bestCandidate.day] =
      (subjectDayCounts[subjectKey][bestCandidate.day] || 0) + demand.span;
  }

  const version = await getNextVersion(section._id);
  const timetable = await Timetable.create({
    title: `${section.program.name} ${section.semesterNumber}-${section.name} Weekly Timetable`,
    department: section.department._id,
    program: section.program._id,
    semesterNumber: section.semesterNumber,
    section: section._id,
    version,
    status: "draft",
    config,
    generatedBy: actor._id,
    conflicts,
  });

  const entries = await TimetableEntry.insertMany(
    Array.from(scheduleMap.values()).map((entry) => ({
      ...entry,
      timetable: timetable._id,
      section: section._id,
    })),
  );

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.TIMETABLE_GENERATED,
    entity: "Timetable",
    entityId: timetable._id,
    metadata: {
      section: section.code,
      version,
      generatedEntries: entries.length,
      conflicts: conflicts.length,
    },
    req,
  });

  return Timetable.findById(timetable._id)
    .populate("department program section generatedBy publishedBy")
    .lean()
    .then((doc) => ({
      ...doc,
      entries: entries.sort((a, b) => a.day.localeCompare(b.day) || a.periodNumber - b.periodNumber),
    }));
}

export async function listTimetables(query, user) {
  const filter = {};
  if (query.sectionId) {
    filter.section = query.sectionId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  if (user.role === ROLES.STUDENT || user.role === ROLES.FACULTY) {
    filter.status = "published";
  }

  const timetables = await Timetable.find(filter)
    .populate("department program section generatedBy publishedBy")
    .sort({ createdAt: -1 });

  const timetableIds = timetables.map((item) => item._id);
  const entries = await TimetableEntry.find({ timetable: { $in: timetableIds } })
    .populate("section subject faculty classroom laboratory");

  return timetables.map((timetable) => ({
    ...timetable.toObject(),
    entries: entries.filter((entry) => String(entry.timetable) === String(timetable._id)),
  }));
}

export async function updateTimetableEntry(timetableId, entryId, payload) {
  const entry = await TimetableEntry.findOneAndUpdate(
    { _id: entryId, timetable: timetableId },
    {
      subject: payload.subjectId,
      faculty: payload.facultyId,
      classroom: payload.classroomId,
      laboratory: payload.laboratoryId,
      notes: payload.notes,
      isLocked: payload.isLocked,
      source: "manual",
    },
    { new: true, runValidators: true },
  ).populate("section subject faculty classroom laboratory");

  if (!entry) {
    throw new ApiError(404, "Timetable entry not found.");
  }

  return entry;
}

export async function publishTimetable(timetableId, actor, req) {
  await Timetable.updateMany(
    {
      section: (await Timetable.findById(timetableId))?.section,
      status: "published",
    },
    { status: "archived" },
  );

  const timetable = await Timetable.findByIdAndUpdate(
    timetableId,
    {
      status: "published",
      publishedAt: new Date(),
      publishedBy: actor._id,
    },
    { new: true },
  ).populate("department program section generatedBy publishedBy");

  if (!timetable) {
    throw new ApiError(404, "Timetable not found.");
  }

  await createAuditLog({
    actor,
    action: AUDIT_ACTIONS.TIMETABLE_PUBLISHED,
    entity: "Timetable",
    entityId: timetable._id,
    req,
  });

  const entries = await TimetableEntry.find({ timetable: timetable._id })
    .populate("section subject faculty classroom laboratory");

  return {
    ...timetable.toObject(),
    entries,
  };
}

export async function regenerateDay(timetableId, payload, actor, req) {
  const timetable = await Timetable.findById(timetableId);

  if (!timetable) {
    throw new ApiError(404, "Timetable not found.");
  }

  const rebuilt = await generateWeeklyTimetable(
    {
      sectionId: String(timetable.section),
      ...timetable.config,
    },
    actor,
    req,
  );

  const preservedEntries = await TimetableEntry.find({
    timetable: timetable._id,
    day: { $ne: payload.day },
  });

  await TimetableEntry.deleteMany({ timetable: timetable._id });
  const newEntries = [
    ...preservedEntries.map((entry) => ({
      ...entry.toObject(),
      _id: undefined,
      timetable: timetable._id,
    })),
    ...rebuilt.entries
      .filter((entry) => entry.day === payload.day)
      .map((entry) => ({
        ...entry,
        _id: undefined,
        timetable: timetable._id,
      })),
  ];

  const inserted = await TimetableEntry.insertMany(newEntries);
  timetable.conflicts = rebuilt.conflicts || [];
  await timetable.save();

  return {
    ...timetable.toObject(),
    entries: inserted,
  };
}

export async function getFacultyTimetable(user) {
  const faculty = await FacultyProfile.findOne({ user: user._id });
  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found.");
  }

  const entries = await TimetableEntry.find({ faculty: faculty._id })
    .populate({
      path: "timetable",
      match: { status: "published" },
      populate: ["department", "program", "section"],
    })
    .populate("section subject classroom laboratory")
    .sort({ day: 1, periodNumber: 1 });

  return entries.filter((entry) => entry.timetable);
}
