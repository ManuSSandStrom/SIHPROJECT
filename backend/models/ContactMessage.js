import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    collegeId: { type: String, trim: true, uppercase: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "in_review", "resolved"],
      default: "new",
    },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

const ContactMessage = mongoose.model("ContactMessage", ContactMessageSchema);

export default ContactMessage;
