import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "admin", "lecturer"],
      default: "student",
    },
    collegeId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    clerkId: { type: String, unique: true, sparse: true, trim: true },
    department: { type: String, trim: true },
    semester: { type: Number },
    section: { type: String, trim: true },
    yearOfStudy: { type: Number },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
    profileComplete: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
