import { env } from "../config/env.js";
import { DAYS_OF_WEEK, FEEDBACK_CATEGORIES, ROLES, USER_STATUSES } from "../constants/app.js";
import {
  Classroom,
  Department,
  FacultyAssignment,
  FeedbackCycle,
  FeedbackTemplate,
  FacultyProfile,
  Holiday,
  Laboratory,
  Program,
  Section,
  Semester,
  Subject,
  StudentProfile,
  User,
} from "../models/index.js";
import { ensureDefaultAdmin } from "../services/auth.service.js";
import { hashPassword } from "../utils/security.js";

export async function seedDatabase() {
  await ensureDefaultAdmin({
    email: env.defaultAdminEmail,
    password: env.defaultAdminPassword,
  });

  const existingDepartment = await Department.findOne({ code: "CSE" });
  if (existingDepartment) {
    return;
  }

  const department = await Department.create({
    name: "Computer Science and Engineering",
    code: "CSE",
    hodName: "Dr. R. Kavya",
    description: "Smart classroom enabled engineering department",
  });

  const program = await Program.create({
    name: "B.Tech Computer Science",
    code: "BTCS",
    department: department._id,
    degreeLevel: "UG",
    durationSemesters: 8,
  });

  await Semester.create({
    program: program._id,
    number: 5,
    title: "Semester 5",
    workingDays: DAYS_OF_WEEK,
    periodsPerDay: 7,
    lunchAfterPeriod: 4,
  });

  const sectionA = await Section.create({
    name: "Section A",
    code: "A",
    department: department._id,
    program: program._id,
    semesterNumber: 5,
    batchYear: new Date().getFullYear() - 2,
    strength: 48,
  });

  const subjects = await Subject.insertMany([
    {
      name: "Advanced Algorithms",
      code: "CS501",
      department: department._id,
      program: program._id,
      semesterNumber: 5,
      weeklyHours: 4,
      labHours: 0,
      type: "theory",
    },
    {
      name: "Operating Systems",
      code: "CS502",
      department: department._id,
      program: program._id,
      semesterNumber: 5,
      weeklyHours: 3,
      labHours: 0,
      type: "theory",
    },
    {
      name: "Database Systems Lab",
      code: "CS5L1",
      department: department._id,
      program: program._id,
      semesterNumber: 5,
      weeklyHours: 1,
      labHours: 2,
      type: "lab",
    },
  ]);

  const facultyUsers = await Promise.all([
    User.create({
      fullName: "Dr. Meera S",
      email: "meera.faculty@college.edu",
      passwordHash: await hashPassword("Faculty@123"),
      role: ROLES.FACULTY,
      status: USER_STATUSES.ACTIVE,
      phone: "9876543210",
    }),
    User.create({
      fullName: "Prof. Arjun K",
      email: "arjun.faculty@college.edu",
      passwordHash: await hashPassword("Faculty@123"),
      role: ROLES.FACULTY,
      status: USER_STATUSES.ACTIVE,
      phone: "9876543211",
    }),
  ]);

  const facultyProfiles = await Promise.all([
    FacultyProfile.create({
      user: facultyUsers[0]._id,
      staffId: "FAC1001",
      qualification: "PhD",
      department: department._id,
      specialization: ["Algorithms", "Data Structures"],
      assignedSections: [sectionA._id],
    }),
    FacultyProfile.create({
      user: facultyUsers[1]._id,
      staffId: "FAC1002",
      qualification: "M.Tech",
      department: department._id,
      specialization: ["Databases", "Operating Systems", "Lab Management"],
      assignedSections: [sectionA._id],
    }),
  ]);

  await FacultyAssignment.insertMany([
    {
      faculty: facultyProfiles[0]._id,
      subject: subjects[0]._id,
      department: department._id,
      program: program._id,
      section: sectionA._id,
      semesterNumber: 5,
    },
    {
      faculty: facultyProfiles[1]._id,
      subject: subjects[1]._id,
      department: department._id,
      program: program._id,
      section: sectionA._id,
      semesterNumber: 5,
    },
    {
      faculty: facultyProfiles[1]._id,
      subject: subjects[2]._id,
      department: department._id,
      program: program._id,
      section: sectionA._id,
      semesterNumber: 5,
      preferredRoomType: "lab",
    },
  ]);

  await Classroom.create({
    name: "Smart Room 501",
    code: "SR501",
    building: "Academic Block A",
    floor: 5,
    capacity: 60,
    features: ["Projector", "Smart Board", "Audio"],
  });

  await Laboratory.create({
    name: "Cloud Lab 2",
    code: "CLAB2",
    building: "Innovation Block",
    floor: 2,
    capacity: 50,
    labType: "Computer Lab",
    features: ["40 Systems", "Smart Panel", "Backup Power"],
  });

  const studentUsers = await Promise.all(
    ["Aarav", "Diya", "Ishaan", "Nisha", "Rahul"].map((name, index) =>
      User.create({
        fullName: `${name} Student`,
        email: `${name.toLowerCase()}${index + 1}@student.college.edu`,
        passwordHash: await hashPassword("Student@123"),
        role: ROLES.STUDENT,
        status: USER_STATUSES.ACTIVE,
      }),
    ),
  );

  await StudentProfile.insertMany(
    studentUsers.map((user, index) => ({
      user: user._id,
      collegeId: `CSE25A${String(index + 1).padStart(3, "0")}`,
      rollNumber: `25CSEA${String(index + 1).padStart(3, "0")}`,
      department: department._id,
      program: program._id,
      semesterNumber: 5,
      section: sectionA._id,
      batchYear: new Date().getFullYear() - 2,
    })),
  );

  const template = await FeedbackTemplate.create({
    name: "Standard Lecturer Review",
    description: "Default template for teaching and lab feedback.",
    questions: FEEDBACK_CATEGORIES.map((category) => ({
      key: category,
      label: category.replaceAll("_", " "),
      category,
      type: "rating",
      maxScore: 5,
    })),
  });

  await FeedbackCycle.create({
    title: "Mid Semester Teaching Feedback",
    department: department._id,
    program: program._id,
    semesterNumber: 5,
    section: sectionA._id,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    active: true,
    feedbackTemplate: template._id,
  });

  await Holiday.create({
    title: "Founders Day",
    date: new Date(new Date().getFullYear(), 7, 15),
    department: department._id,
    fullAttendance: false,
    description: "College foundation celebration",
  });
}
