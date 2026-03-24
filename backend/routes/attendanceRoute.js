import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";

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

    const created = await Attendance.insertMany(records);
    res.status(201).json(created);
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
      department: student.department,
      section: student.section,
      semester: student.semester,
      courseCode,
      courseName,
      facultyName: "Administration",
      date: attendanceDate,
      slotLabel: "Holiday",
      sessionType: "special",
      status: "present",
      notes: description,
      markedBy,
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
