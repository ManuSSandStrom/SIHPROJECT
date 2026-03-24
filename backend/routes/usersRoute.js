import { Router } from "express";
import User from "../models/User.js";
import { hashPassword, sanitizeUser, verifyPassword } from "../utils/auth.js";

export const usersRouter = Router();

usersRouter.get("/", async (req, res) => {
  try {
    const { role, department, section } = req.query;
    const query = role ? { role } : {};
    if (department) {
      query.department = department;
    }
    if (section) {
      query.section = section;
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

usersRouter.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "student",
      collegeId,
      department,
      semester,
      section,
      yearOfStudy,
      phone,
      clerkId,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const normalizedCollegeId = collegeId ? String(collegeId).trim().toUpperCase() : undefined;
    const normalizedRole = ["student", "admin", "lecturer"].includes(role) ? role : "student";

    if ((normalizedRole === "student" || normalizedRole === "lecturer") && !normalizedCollegeId) {
      return res.status(400).json({ error: "College ID is required for students and lecturers." });
    }

    const existingEmail = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    if (normalizedCollegeId) {
      const existingCollegeId = await User.findOne({ collegeId: normalizedCollegeId });
      if (existingCollegeId) {
        return res.status(409).json({ error: "College ID is already registered." });
      }
    }

    const { salt, passwordHash } = hashPassword(password);

    const createdUser = await User.create({
      name,
      email,
      passwordHash,
      salt,
      role: normalizedRole,
      collegeId: normalizedCollegeId,
      department,
      semester,
      section,
      yearOfStudy,
      phone,
      clerkId,
      profileComplete: Boolean(normalizedCollegeId && department),
    });

    res.status(201).json({ user: sanitizeUser(createdUser) });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ error: "Failed to sign up user" });
  }
});

usersRouter.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(500).json({ error: "Failed to sign in user" });
  }
});

usersRouter.put("/:id", async (req, res) => {
  try {
    const { password, collegeId, ...rest } = req.body;
    const updates = { ...rest };

    if (collegeId) {
      updates.collegeId = String(collegeId).trim().toUpperCase();
      const duplicateCollegeId = await User.findOne({
        _id: { $ne: req.params.id },
        collegeId: updates.collegeId,
      });
      if (duplicateCollegeId) {
        return res.status(409).json({ error: "College ID is already registered." });
      }
    }

    if (password) {
      const { salt, passwordHash } = hashPassword(password);
      updates.salt = salt;
      updates.passwordHash = passwordHash;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});
