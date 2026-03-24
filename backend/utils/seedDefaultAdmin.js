import User from "../models/User.js";
import { hashPassword } from "./auth.js";

export async function seedDefaultAdmin() {
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "admin@blueboard.edu").toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    return existingAdmin;
  }

  const { salt, passwordHash } = hashPassword(adminPassword);

  return User.create({
    name: "BlueBoard Admin",
    email: adminEmail,
    passwordHash,
    salt,
    role: "admin",
    collegeId: "ADMIN001",
    department: "Administration",
    section: "HQ",
    profileComplete: true,
    status: "active",
  });
}
