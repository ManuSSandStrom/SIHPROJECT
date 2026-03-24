export const demoPortalData = {
  currentUser: {
    _id: "admin-1",
    name: "BlueBoard Admin",
    email: "admin@blueboard.edu",
    role: "admin",
    collegeId: "ADMIN001",
    department: "Administration",
  },
  dashboard: {
    kpis: {
      totalStudents: 428,
      totalLecturers: 36,
      totalCourses: 24,
      activeTimetables: 3,
      attendanceRate: 92,
      openIssues: 8,
      averageFeedback: 4.6,
      holidayCount: 2,
    },
  },
  users: [
    { _id: "admin-1", name: "BlueBoard Admin", email: "admin@blueboard.edu", role: "admin", collegeId: "ADMIN001", createdAt: "2026-03-20T09:30:00.000Z" },
    { _id: "student-1", name: "Ananya Reddy", email: "ananya@blueboard.edu", role: "student", collegeId: "CS23041", department: "Computer Science", semester: 5, section: "A", createdAt: "2026-03-21T10:00:00.000Z" },
    { _id: "student-2", name: "Vikram Kumar", email: "vikram@blueboard.edu", role: "student", collegeId: "CS23042", department: "Computer Science", semester: 5, section: "A", createdAt: "2026-03-21T10:15:00.000Z" },
    { _id: "student-3", name: "Priya Sharma", email: "priya@blueboard.edu", role: "student", collegeId: "CS23043", department: "Computer Science", semester: 5, section: "B", createdAt: "2026-03-21T11:00:00.000Z" },
  ],
  faculty: [
    { _id: "faculty-1", name: "Dr. Meera Iyer", email: "meera@blueboard.edu", employeeId: "FAC101", department: "Computer Science", designation: "Professor", specialization: ["AI", "Machine Learning"], assignedSubjects: [{ subjectName: "Machine Learning", courseCode: "CS501", department: "Computer Science", semester: 5, section: "A" }], officeLocation: "Block A - 301" },
    { _id: "faculty-2", name: "Prof. Arjun Das", email: "arjun@blueboard.edu", employeeId: "FAC102", department: "Computer Science", designation: "Lecturer", specialization: ["Data Structures", "Algorithms"], assignedSubjects: [{ subjectName: "Cloud Computing", courseCode: "CS503", department: "Computer Science", semester: 5, section: "A" }], officeLocation: "Block A - 205" },
  ],
  courses: [
    { _id: "course-1", name: "Machine Learning", code: "CS501", department: "Computer Science", semester: 5, type: "lecture", hoursPerWeek: 3 },
    { _id: "course-2", name: "Data Structures Lab", code: "CS502", department: "Computer Science", semester: 5, type: "lab", hoursPerWeek: 2 },
    { _id: "course-3", name: "Cloud Computing", code: "CS503", department: "Computer Science", semester: 5, type: "lecture", hoursPerWeek: 3 },
  ],
  timetables: [
    {
      _id: "tt-1",
      name: "Computer Science - Semester 5 2026",
      department: "Computer Science",
      semester: "5",
      status: "published",
      schedule: [
        { day: "Monday", courseName: "Machine Learning", facultyName: "Dr. Meera Iyer", roomName: "Blue Lab 1", timeSlot: "09:00-10:00" },
        { day: "Tuesday", courseName: "Cloud Computing", facultyName: "Prof. Arjun Das", roomName: "Seminar Hall", timeSlot: "10:00-11:00" },
        { day: "Wednesday", courseName: "Data Structures Lab", facultyName: "Prof. Arjun Das", roomName: "Blue Lab 1", timeSlot: "11:15-12:15" },
        { day: "Thursday", courseName: "Machine Learning", facultyName: "Dr. Meera Iyer", roomName: "Blue Lab 1", timeSlot: "13:15-14:15" },
        { day: "Friday", courseName: "Cloud Computing", facultyName: "Prof. Arjun Das", roomName: "Seminar Hall", timeSlot: "14:15-15:15" },
        { day: "Saturday", courseName: "Machine Learning", facultyName: "Dr. Meera Iyer", roomName: "Innovation Room", timeSlot: "09:00-10:00" },
        { day: "Sunday", courseName: "Special Placement Workshop", facultyName: "Dr. Meera Iyer", roomName: "Auditorium", timeSlot: "10:00-11:00" },
      ],
    },
  ],
  attendance: [
    { _id: "att-1", studentName: "Ananya Reddy", collegeId: "CS23041", department: "Computer Science", section: "A", courseCode: "CS501", courseName: "Machine Learning", slotLabel: "09:00 - 10:00", status: "present", date: "2026-03-24T09:00:00.000Z" },
    { _id: "att-2", studentName: "Vikram Kumar", collegeId: "CS23042", department: "Computer Science", section: "A", courseCode: "CS503", courseName: "Cloud Computing", slotLabel: "10:00 - 11:00", status: "late", date: "2026-03-24T10:00:00.000Z" },
  ],
  holidays: [
    { _id: "holiday-1", title: "College Fest", description: "Full attendance granted for Section A on fest day.", date: "2026-03-26T00:00:00.000Z", department: "Computer Science", section: "A" },
    { _id: "holiday-2", title: "National Holiday", description: "Attendance applied to all departments.", date: "2026-03-29T00:00:00.000Z", department: "All Departments", section: "All Sections" },
  ],
  issues: [
    { _id: "issue-1", studentName: "Ananya Reddy", collegeId: "CS23041", title: "Attendance mismatch", description: "Yesterday's lab session is marked absent even though I attended the full class.", category: "attendance", priority: "high", status: "in_review", createdAt: "2026-03-23T15:00:00.000Z" },
    { _id: "issue-2", studentName: "Vikram Kumar", collegeId: "CS23042", title: "Projector not working", description: "Room 402 projector was not working during the afternoon session.", category: "facilities", priority: "medium", status: "open", createdAt: "2026-03-24T08:00:00.000Z" },
  ],
  feedback: [
    { _id: "feed-1", studentName: "Ananya Reddy", collegeId: "CS23041", title: "Timetable view is easier now", category: "teaching", rating: 5, lecturerId: "faculty-1", lecturerName: "Dr. Meera Iyer", message: "The weekly cards are much clearer on mobile than the old table layout.", status: "reviewed", createdAt: "2026-03-22T11:00:00.000Z" },
    { _id: "feed-2", studentName: "Vikram Kumar", collegeId: "CS23042", title: "Need more lab notices", category: "teaching", rating: 4, lecturerId: "faculty-2", lecturerName: "Prof. Arjun Das", message: "Would be helpful if special lab announcements also showed beside the timetable.", status: "shared_with_lecturer", createdAt: "2026-03-24T09:30:00.000Z" },
  ],
  notifications: [
    { _id: "note-1", title: "Saturday class plan published", message: "Semester 5 timetable has been refreshed with Saturday academic blocks.", type: "success" },
    { _id: "note-2", title: "Sunday special class available", message: "Admin enabled a special workshop option for placement and revision sessions.", type: "info" },
    { _id: "note-3", title: "Support desk reminder", message: "Please resolve open attendance issues before the next reporting cycle.", type: "warning" },
  ],
};

export function generateDemoTimetable(form, courses, faculty) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slots = ["09:00-10:00", "10:00-11:00", "11:15-12:15", "13:15-14:15", "14:15-15:15", "15:15-16:15"];
  const schedule = days.map((day, index) => ({
    day,
    courseName: courses[index % courses.length]?.name || "Professional Communication",
    facultyName: faculty[index % faculty.length]?.name || "Staff Faculty",
    roomName: index % 2 === 0 ? "Blue Lab 1" : "Seminar Hall",
    timeSlot: slots[index],
  }));

  if (form.includeSundaySpecialClass) {
    schedule.push({
      day: "Sunday",
      courseName: "Sunday Special Mentoring",
      facultyName: faculty[0]?.name || "Placement Team",
      roomName: "Auditorium",
      timeSlot: "10:00-11:00",
    });
  }

  return {
    _id: String(Date.now()),
    name: `${form.department} - Semester ${form.semester} ${form.academicYear}`,
    department: form.department,
    semester: String(form.semester),
    status: "draft",
    schedule,
  };
}
