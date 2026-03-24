import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentName: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    lecturerId: { type: String, trim: true },
    lecturerName: { type: String, trim: true },
    subjectName: { type: String, trim: true },
    department: { type: String, trim: true },
    section: { type: String, trim: true },
    semester: { type: Number },
    feedbackScope: {
      type: String,
      enum: ["teaching", "lab", "notes", "overall"],
      default: "overall",
    },
    category: {
      type: String,
      enum: ["teaching", "lab", "notes", "facilities", "platform", "support", "general"],
      default: "general",
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    teachingRating: { type: Number, min: 1, max: 5 },
    labRating: { type: Number, min: 1, max: 5 },
    notesRating: { type: Number, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "reviewed", "actioned", "shared_with_lecturer"],
      default: "new",
    },
    response: { type: String, trim: true },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", FeedbackSchema);

export default Feedback;
