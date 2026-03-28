import {
  AdminProfile,
  FacultyProfile,
  StudentProfile,
} from "../models/index.js";

export async function loadUserProfile(user) {
  if (!user) {
    return null;
  }

  if (user.role === "student") {
    return StudentProfile.findOne({ user: user._id })
      .populate("department program section");
  }

  if (user.role === "faculty") {
    return FacultyProfile.findOne({ user: user._id })
      .populate("department assignedSections approvedBy");
  }

  return AdminProfile.findOne({ user: user._id }).populate("user");
}

export async function serializeUser(user) {
  const profile = await loadUserProfile(user);

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    profile,
  };
}
