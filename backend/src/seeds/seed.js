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

const departmentSeeds = [
  {
    key: "CSE",
    name: "Computer Science and Engineering",
    code: "CSE",
    hodName: "Dr. R. Kavya",
    description: "Smart classroom enabled computing department",
  },
  {
    key: "IT",
    name: "Information Technology",
    code: "IT",
    hodName: "Dr. P. Naveen",
    description: "Industry-focused information technology department",
  },
  {
    key: "ECE",
    name: "Electronics and Communication Engineering",
    code: "ECE",
    hodName: "Dr. S. Harini",
    description: "Communication systems and electronics department",
  },
  {
    key: "EEE",
    name: "Electrical and Electronics Engineering",
    code: "EEE",
    hodName: "Dr. M. Raghav",
    description: "Electrical systems and power engineering department",
  },
  {
    key: "ME",
    name: "Mechanical Engineering",
    code: "ME",
    hodName: "Dr. A. Prakash",
    description: "Mechanical design and manufacturing department",
  },
  {
    key: "CE",
    name: "Civil Engineering",
    code: "CE",
    hodName: "Dr. N. Sushma",
    description: "Infrastructure and construction-focused civil department",
  },
  {
    key: "CA",
    name: "Computer Applications",
    code: "CA",
    hodName: "Dr. K. Deepa",
    description: "Postgraduate computer applications department",
  },
  {
    key: "MS",
    name: "Management Studies",
    code: "MS",
    hodName: "Dr. V. Arun",
    description: "Business administration and management department",
  },
];

const programSeeds = [
  {
    key: "BTCSE",
    name: "B.Tech Computer Science and Engineering",
    code: "BTCSE",
    departmentKey: "CSE",
    degreeLevel: "UG",
    durationSemesters: 8,
  },
  {
    key: "BTIT",
    name: "B.Tech Information Technology",
    code: "BTIT",
    departmentKey: "IT",
    degreeLevel: "UG",
    durationSemesters: 8,
  },
  {
    key: "BTECE",
    name: "B.Tech Electronics and Communication Engineering",
    code: "BTECE",
    departmentKey: "ECE",
    degreeLevel: "UG",
    durationSemesters: 8,
  },
  {
    key: "BTEEE",
    name: "B.Tech Electrical and Electronics Engineering",
    code: "BTEEE",
    departmentKey: "EEE",
    degreeLevel: "UG",
    durationSemesters: 8,
  },
  {
    key: "BTME",
    name: "B.Tech Mechanical Engineering",
    code: "BTME",
    departmentKey: "ME",
    degreeLevel: "UG",
    durationSemesters: 8,
  },
  {
    key: "BTCE",
    name: "B.Tech Civil Engineering",
    code: "BTCE",
    departmentKey: "CE",
    degreeLevel: "UG",
    durationSemesters: 8,
  },
  {
    key: "MCA",
    name: "Master of Computer Applications",
    code: "MCA",
    departmentKey: "CA",
    degreeLevel: "PG",
    durationSemesters: 4,
  },
  {
    key: "MBA",
    name: "Master of Business Administration",
    code: "MBA",
    departmentKey: "MS",
    degreeLevel: "PG",
    durationSemesters: 4,
  },
];

async function ensureDepartment(seed) {
  return Department.findOneAndUpdate(
    { code: seed.code },
    seed,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function ensureProgram(seed, departmentId) {
  return Program.findOneAndUpdate(
    { code: seed.code, department: departmentId },
    {
      name: seed.name,
      code: seed.code,
      department: departmentId,
      degreeLevel: seed.degreeLevel,
      durationSemesters: seed.durationSemesters,
      active: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function ensureProgramSemesters(program) {
  const operations = Array.from({ length: program.durationSemesters }, (_, index) =>
    Semester.findOneAndUpdate(
      { program: program._id, number: index + 1 },
      {
        program: program._id,
        number: index + 1,
        title: `Semester ${index + 1}`,
        workingDays: DAYS_OF_WEEK,
        periodsPerDay: 7,
        lunchAfterPeriod: 4,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  );

  await Promise.all(operations);
}

async function ensureUser({ fullName, email, password, role, status, phone }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return existing;
  }

  return User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role,
    status,
    phone,
  });
}

export async function seedDatabase() {
  await ensureDefaultAdmin({
    email: env.defaultAdminEmail,
    password: env.defaultAdminPassword,
  });

  const departmentMap = {};
  for (const departmentSeed of departmentSeeds) {
    departmentMap[departmentSeed.key] = await ensureDepartment(departmentSeed);
  }

  const programMap = {};
  for (const programSeed of programSeeds) {
    const program = await ensureProgram(programSeed, departmentMap[programSeed.departmentKey]._id);
    programMap[programSeed.key] = program;
    await ensureProgramSemesters(program);
  }

  const demoDepartment = departmentMap.CSE;
  const demoProgram = programMap.BTCSE;
  const currentBatchYear = new Date().getFullYear() - 2;

  const sectionA = await Section.findOneAndUpdate(
    { department: demoDepartment._id, program: demoProgram._id, semesterNumber: 5, code: "A" },
    {
      name: "Section A",
      code: "A",
      department: demoDepartment._id,
      program: demoProgram._id,
      semesterNumber: 5,
      batchYear: currentBatchYear,
      strength: 48,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const subjectSeeds = [
    {
      name: "Advanced Algorithms",
      code: "CS501",
      department: demoDepartment._id,
      program: demoProgram._id,
      semesterNumber: 5,
      weeklyHours: 4,
      labHours: 0,
      type: "theory",
    },
    {
      name: "Operating Systems",
      code: "CS502",
      department: demoDepartment._id,
      program: demoProgram._id,
      semesterNumber: 5,
      weeklyHours: 3,
      labHours: 0,
      type: "theory",
    },
    {
      name: "Database Systems Lab",
      code: "CS5L1",
      department: demoDepartment._id,
      program: demoProgram._id,
      semesterNumber: 5,
      weeklyHours: 1,
      labHours: 2,
      type: "lab",
    },
  ];

  const subjects = [];
  for (const subjectSeed of subjectSeeds) {
    const subject = await Subject.findOneAndUpdate(
      { code: subjectSeed.code },
      subjectSeed,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    subjects.push(subject);
  }

  const facultyUsers = await Promise.all([
    ensureUser({
      fullName: "Dr. Meera S",
      email: "meera.faculty@college.edu",
      password: "Faculty@123",
      role: ROLES.FACULTY,
      status: USER_STATUSES.ACTIVE,
      phone: "9876543210",
    }),
    ensureUser({
      fullName: "Prof. Arjun K",
      email: "arjun.faculty@college.edu",
      password: "Faculty@123",
      role: ROLES.FACULTY,
      status: USER_STATUSES.ACTIVE,
      phone: "9876543211",
    }),
  ]);

  const facultyProfiles = await Promise.all([
    FacultyProfile.findOneAndUpdate(
      { staffId: "FAC1001" },
      {
        user: facultyUsers[0]._id,
        staffId: "FAC1001",
        qualification: "PhD",
        department: demoDepartment._id,
        specialization: ["Algorithms", "Data Structures"],
        assignedSections: [sectionA._id],
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
    FacultyProfile.findOneAndUpdate(
      { staffId: "FAC1002" },
      {
        user: facultyUsers[1]._id,
        staffId: "FAC1002",
        qualification: "M.Tech",
        department: demoDepartment._id,
        specialization: ["Databases", "Operating Systems", "Lab Management"],
        assignedSections: [sectionA._id],
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);

  const assignmentSeeds = [
    {
      faculty: facultyProfiles[0]._id,
      subject: subjects[0]._id,
      department: demoDepartment._id,
      program: demoProgram._id,
      section: sectionA._id,
      semesterNumber: 5,
      preferredRoomType: "classroom",
    },
    {
      faculty: facultyProfiles[1]._id,
      subject: subjects[1]._id,
      department: demoDepartment._id,
      program: demoProgram._id,
      section: sectionA._id,
      semesterNumber: 5,
      preferredRoomType: "classroom",
    },
    {
      faculty: facultyProfiles[1]._id,
      subject: subjects[2]._id,
      department: demoDepartment._id,
      program: demoProgram._id,
      section: sectionA._id,
      semesterNumber: 5,
      preferredRoomType: "lab",
    },
  ];

  for (const assignmentSeed of assignmentSeeds) {
    await FacultyAssignment.findOneAndUpdate(
      {
        faculty: assignmentSeed.faculty,
        subject: assignmentSeed.subject,
        section: assignmentSeed.section,
      },
      assignmentSeed,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  await Classroom.findOneAndUpdate(
    { code: "SR501" },
    {
      name: "Smart Room 501",
      code: "SR501",
      building: "Academic Block A",
      floor: 5,
      capacity: 60,
      features: ["Projector", "Smart Board", "Audio"],
      active: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await Laboratory.findOneAndUpdate(
    { code: "CLAB2" },
    {
      name: "Cloud Lab 2",
      code: "CLAB2",
      building: "Innovation Block",
      floor: 2,
      capacity: 50,
      labType: "Computer Lab",
      features: ["40 Systems", "Smart Panel", "Backup Power"],
      active: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const studentPasswordHash = await hashPassword("Student@123");
  for (const [index, name] of ["Aarav", "Diya", "Ishaan", "Nisha", "Rahul"].entries()) {
    const email = `${name.toLowerCase()}${index + 1}@student.college.edu`;
    const collegeId = `CSE25A${String(index + 1).padStart(3, "0")}`;
    const rollNumber = `25CSEA${String(index + 1).padStart(3, "0")}`;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: `${name} Student`,
        email,
        passwordHash: studentPasswordHash,
        role: ROLES.STUDENT,
        status: USER_STATUSES.ACTIVE,
      });
    }

    await StudentProfile.findOneAndUpdate(
      { collegeId },
      {
        user: user._id,
        collegeId,
        rollNumber,
        department: demoDepartment._id,
        program: demoProgram._id,
        semesterNumber: 5,
        section: sectionA._id,
        batchYear: currentBatchYear,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  const template = await FeedbackTemplate.findOneAndUpdate(
    { name: "Standard Lecturer Review" },
    {
      name: "Standard Lecturer Review",
      description: "Default template for teaching and lab feedback.",
      questions: FEEDBACK_CATEGORIES.map((category) => ({
        key: category,
        label: category.replaceAll("_", " "),
        category,
        type: "rating",
        maxScore: 5,
      })),
      active: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await FeedbackCycle.findOneAndUpdate(
    { title: "Mid Semester Teaching Feedback", section: sectionA._id },
    {
      title: "Mid Semester Teaching Feedback",
      department: demoDepartment._id,
      program: demoProgram._id,
      semesterNumber: 5,
      section: sectionA._id,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      active: true,
      feedbackTemplate: template._id,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await Holiday.findOneAndUpdate(
    { title: "Founders Day" },
    {
      title: "Founders Day",
      date: new Date(new Date().getFullYear(), 7, 15),
      department: demoDepartment._id,
      fullAttendance: false,
      description: "College foundation celebration",
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}
