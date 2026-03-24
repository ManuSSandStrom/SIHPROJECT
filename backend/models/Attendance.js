import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true, uppercase: true },
    department: { type: String, trim: true },
    section: { type: String, trim: true },
    semester: { type: Number },
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    courseName: { type: String, required: true, trim: true },
    facultyName: { type: String, trim: true },
    date: { type: Date, required: true },
    slotLabel: { type: String, trim: true },
    sessionType: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "special"],
      default: "lecture",
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },
    notes: { type: String, trim: true },
    markedBy: { type: String, trim: true },
    isHoliday: { type: Boolean, default: false },
    holidayTitle: { type: String, trim: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ studentId: 1, courseCode: 1, date: 1 });

const Attendance = mongoose.model("Attendance", AttendanceSchema);

export default Attendance;
