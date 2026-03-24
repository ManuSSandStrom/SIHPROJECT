import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    department: { type: String, trim: true, default: "All Departments" },
    section: { type: String, trim: true, default: "All Sections" },
    fullAttendance: { type: Boolean, default: true },
    createdBy: { type: String, trim: true, default: "Admin" },
  },
  { timestamps: true }
);

HolidaySchema.index({ date: 1, department: 1, section: 1 }, { unique: true });

const Holiday = mongoose.model("Holiday", HolidaySchema);

export default Holiday;
