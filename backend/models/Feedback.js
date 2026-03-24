import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentName: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    lecturerId: { type: String, trim: true },
    lecturerName: { type: String, trim: true },
    category: {
      type: String,
      enum: ["teaching", "facilities", "platform", "support", "general"],
      default: "general",
    },
    rating: { type: Number, min: 1, max: 5, required: true },
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
