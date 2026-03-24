import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Faculty from "../models/Faculty.js";
import Holiday from "../models/Holiday.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import Course from "../models/course.js";

export const attendanceRouter = Router();

attendanceRouter.get("/", async (req, res) => {
  try {
    const { studentId, courseCode, department, section, date } = req.query;
    const query = {};

    if (studentId) {
      query.studentId = studentId;
    }
    if (courseCode) {
      query.courseCode = String(courseCode).trim().toUpperCase();
    }
    if (department) {
      query.department = department;
    }
    if (section) {
      query.section = section;
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(query).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

attendanceRouter.get("/summary", async (_req, res) => {
  try {
    const records = await Attendance.find();
    const presentCount = records.filter((record) => record.status === "present").length;
    const attendanceRate = records.length ? Math.round((presentCount / records.length) * 100) : 0;
    const lateCount = records.filter((record) => record.status === "late").length;

    res.json({
      totalRecords: records.length,
      presentCount,
      lateCount,
      attendanceRate,
    });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
});

attendanceRouter.get("/lecturer-workspace", async (req, res) => {
  try {
    const { email, staffId, date } = req.query;
    if (!email && !staffId) {
      return res.status(400).json({ error: "Lecturer email or staff ID is required." });
    }

    const lecturer = await User.findOne(
      staffId
        ? { staffId: String(staffId).trim().toUpperCase(), role: "lecturer" }
        : { email: String(email).trim().toLowerCase(), role: "lecturer" }
    );

    if (!lecturer) {
      return res.status(404).json({ error: "Lecturer account not found." });
    }

    const faculty = await Faculty.findOne({
      $or: [
        lecturer.staffId ? { employeeId: lecturer.staffId } : null,
        { email: lecturer.email },
        { name: lecturer.name },
      ].filter(Boolean),
    });

    if (!faculty) {
      return res.status(404).json({ error: "Lecturer is not linked to faculty scheduling data yet." });
    }

    const targetDate = date ? new Date(date) : new Date();
    const weekday = targetDate.toLocaleDateString("en-US", { weekday: "long" });
    const timetableDocs = await Timetable.find({
      status: { $in: ["draft", "published"] },
      "schedule.day": weekday,
    }).sort({ updatedAt: -1 });

    const courseIds = new Set();
    const assignments = [];

    timetableDocs.forEach((timetable) => {
      timetable.schedule
        .filter(
          (entry) =>
            entry.day === weekday &&
            (String(entry.facultyId) === String(faculty._id) || entry.facultyName === faculty.name)
        )
        .forEach((entry) => {
          courseIds.add(String(entry.courseId));
          assignments.push({ timetable, entry });
        });
    });

    const courses = await Course.find({ _id: { $in: Array.from(courseIds) } });
    const recordsDate = targetDate.toISOString().slice(0, 10);

    const lecturerAssignments = await Promise.all(
      assignments.map(async ({ timetable, entry }) => {
        const course = courses.find((item) => String(item._id) === String(entry.courseId));
        const linkedSubject =
          (faculty.assignedSubjects || []).find(
            (item) =>
              item.courseCode === course?.code ||
              item.subjectName?.toLowerCase() === entry.courseName?.toLowerCase()
          ) || {};

        const department = linkedSubject.department || timetable.department || lecturer.department;
        const semester = linkedSubject.semester || Number(timetable.semester);
        const section = linkedSubject.section || lecturer.section || "A";
        const students = await User.find({
          role: "student",
          department,
          section,
          semester,
          status: "active",
        }).sort({ rollNumber: 1, name: 1 });

        const attendanceRecords = await Attendance.find({
          date: {
            $gte: new Date(recordsDate),
            $lt: new Date(new Date(recordsDate).setDate(new Date(recordsDate).getDate() + 1)),
          },
          courseCode: course?.code || linkedSubject.courseCode,
          section,
        });

        return {
          entryId: `${timetable._id}-${entry.day}-${entry.startTime}-${entry.courseId}`,
          department,
          semester,
          section,
          courseCode: course?.code || linkedSubject.courseCode || "",
          courseName: course?.name || entry.courseName,
          subjectName: linkedSubject.subjectName || course?.name || entry.courseName,
          facultyId: String(faculty._id),
          facultyName: faculty.name,
          roomName: entry.roomName,
          slotLabel: entry.timeSlot || `${entry.startTime}-${entry.endTime}`,
          date: recordsDate,
          sessionType: entry.sessionType || course?.type || "lecture",
          students: students.map((student) => {
            const record = attendanceRecords.find((item) => String(item.studentId) === String(student._id));
            return {
              _id: student._id,
              name: student.name,
              rollNumber: student.rollNumber || student.collegeId,
              collegeId: student.collegeId,
              status: record?.status || "present",
            };
          }),
        };
      })
    );

    res.json({
      lecturer: {
        _id: lecturer._id,
        name: lecturer.name,
        email: lecturer.email,
        staffId: lecturer.staffId,
        department: lecturer.department,
      },
      weekday,
      date: recordsDate,
      assignments: lecturerAssignments,
    });
  } catch (error) {
    console.error("Error fetching lecturer workspace:", error);
    res.status(500).json({ error: "Failed to fetch lecturer workspace" });
  }
});

attendanceRouter.post("/", async (req, res) => {
  try {
    const record = await Attendance.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    console.error("Error creating attendance record:", error);
    res.status(500).json({ error: "Failed to create attendance record" });
  }
});

attendanceRouter.post("/bulk", async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "Attendance records are required." });
    }

    const saved = await Promise.all(
      records.map(async (record) => {
        const identity = {
          studentId: record.studentId,
          date: new Date(record.date),
          courseCode: record.courseCode,
          slotLabel: record.slotLabel,
          section: record.section,
        };

        return Attendance.findOneAndUpdate(
          identity,
          {
            ...record,
            date: new Date(record.date),
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );
      })
    );

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating attendance records:", error);
    res.status(500).json({ error: "Failed to create attendance records" });
  }
});

attendanceRouter.post("/holiday", async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      department = "All Departments",
      section = "All Sections",
      markedBy = "Admin",
      courseCode = "HOLIDAY",
      courseName = "Holiday Attendance",
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "Holiday title and date are required." });
    }

    const holiday = await Holiday.create({
      title,
      description,
      date,
      department,
      section,
      fullAttendance: true,
      createdBy: markedBy,
    });

    const studentQuery = { role: "student" };
    if (department !== "All Departments") {
      studentQuery.department = department;
    }
    if (section !== "All Sections") {
      studentQuery.section = section;
    }

    const students = await User.find(studentQuery);
    const attendanceDate = new Date(date);

    const attendanceRecords = students.map((student) => ({
      studentId: student._id,
      studentName: student.name,
      collegeId: student.collegeId,
      rollNumber: student.rollNumber || student.collegeId,
      department: student.department,
      section: student.section,
      semester: student.semester,
      courseCode,
      courseName,
      facultyName: "Administration",
      facultyId: null,
      date: attendanceDate,
      slotLabel: "Holiday",
      sessionType: "special",
      status: "present",
      notes: description,
      markedBy,
      markedByRole: "admin",
      isHoliday: true,
      holidayTitle: title,
    }));

    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
    }

    res.status(201).json({
      holiday,
      createdAttendanceCount: attendanceRecords.length,
    });
  } catch (error) {
    console.error("Error creating holiday attendance:", error);
    res.status(500).json({ error: "Failed to create holiday attendance" });
  }
});

attendanceRouter.put("/:id", async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.json(record);
  } catch (error) {
    console.error("Error updating attendance record:", error);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});
