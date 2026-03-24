import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentName: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["attendance", "timetable", "facilities", "academic", "technical", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "closed"],
      default: "open",
    },
    assignedTo: { type: String, trim: true },
    adminReply: { type: String, trim: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const Issue = mongoose.model("Issue", IssueSchema);

export default Issue;
