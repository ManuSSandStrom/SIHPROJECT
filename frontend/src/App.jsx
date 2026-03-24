import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  LockKeyhole,
  Mail,
  Menu,
  MessageSquareQuote,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { AdminSection } from "./components/AdminSection";
import { AttendanceSection } from "./components/AttendanceSection";
import { FeedbackSection } from "./components/FeedbackSection";
import { IssuesSection } from "./components/IssuesSection";
import { LecturerWorkspaceSection } from "./components/LecturerWorkspaceSection";
import { FeatureCard, InputField, MiniPanel, SectionCard, StatCard, TextAreaField } from "./components/PortalUI";
import DashboardPage from "./pages/Dashboard";
import CoursesPage from "./pages/Courses";
import FacultyPage from "./pages/Faculty";
import NotificationsPage from "./pages/Notifications";
import RoomsPage from "./pages/Rooms";
import TimetablePage from "./pages/Timetable";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const api = axios.create({ baseURL: `${API_BASE_URL}/api`, timeout: 10000 });

const emptyPortalData = {
  dashboard: { kpis: {} },
  users: [],
  faculty: [],
  rooms: [],
  timetables: [],
  attendance: [],
  issues: [],
  feedback: [],
  notifications: [],
  courses: [],
  holidays: [],
  contactMessages: [],
};

const publicNav = [
  { to: "/", label: "Home" },
  { to: "/scheduler", label: "Time Table Scheduler" },
  { to: "/attendance", label: "Attendance" },
  { to: "/complaints", label: "Raise Complaint" },
  { to: "/feedback", label: "Lecturer Feedback" },
  { to: "/contact", label: "Contact / Help" },
  { to: "/student-access", label: "Student Login" },
];

const emptyStudentAuthForm = { name: "", email: "", password: "", collegeId: "", department: "MCA", semester: 1, section: "A", role: "student", phone: "" };
const emptyLecturerAuthForm = { name: "", email: "", password: "", staffId: "", qualification: "", department: "MCA", section: "A", phone: "", role: "lecturer" };
const emptyIssueForm = { title: "", description: "", category: "academic", priority: "medium" };
const emptyFeedbackForm = { title: "", category: "teaching", feedbackScope: "teaching", rating: 5, lecturerId: "", lecturerName: "", subjectName: "", department: "MCA", section: "A", semester: 1, teachingRating: 5, labRating: 5, notesRating: 5, message: "" };
const emptyLecturerForm = { name: "", email: "", employeeId: "", department: "MCA", designation: "Lecturer", phone: "", officeLocation: "", specialization: "Cloud Computing, Data Structures", assignedSubjectName: "", assignedCourseCode: "", assignedSemester: 1, assignedSection: "A", maxHoursPerWeek: 18 };
const emptyStudentForm = { name: "", email: "", password: "Student@123", collegeId: "", rollNumber: "", department: "MCA", semester: 1, section: "A", role: "student", phone: "" };
const emptyHolidayForm = { title: "", description: "", date: new Date().toISOString().slice(0, 10), department: "MCA", section: "A" };
const emptyTimetableForm = { department: "MCA", semester: 1, academicYear: new Date().getFullYear(), includeSundaySpecialClass: true };
const emptyCourseForm = { name: "", code: "", department: "MCA", credits: 4, semester: 1, year: new Date().getFullYear(), description: "", duration: 13, prerequisites: "", type: "lecture", hoursPerWeek: 3 };
const emptyRoomForm = { name: "", building: "MCA Block", floor: 1, capacity: 60, type: "lecture_hall", equipment: "Projector, Smart Board" };
const emptyContactForm = { name: "", email: "", phone: "", collegeId: "", message: "" };

function readStoredUser() {
  try {
    const stored = window.localStorage.getItem("mca-portal-user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <PortalApp />
    </BrowserRouter>
  );
}

function PortalApp() {
  const [portalData, setPortalData] = useState(emptyPortalData);
  const [studentAuthMode, setStudentAuthMode] = useState("signin");
  const [studentAuthForm, setStudentAuthForm] = useState(emptyStudentAuthForm);
  const [lecturerAuthMode, setLecturerAuthMode] = useState("signin");
  const [lecturerAuthForm, setLecturerAuthForm] = useState(emptyLecturerAuthForm);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedbackForm);
  const [lecturerForm, setLecturerForm] = useState(emptyLecturerForm);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [holidayForm, setHolidayForm] = useState(emptyHolidayForm);
  const [timetableForm, setTimetableForm] = useState(emptyTimetableForm);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [attendanceRefreshToken, setAttendanceRefreshToken] = useState(0);
  const location = useLocation();

  useEffect(() => {
    loadPortalData();
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem("mca-portal-user", JSON.stringify(currentUser));
      } else {
        window.localStorage.removeItem("mca-portal-user");
      }
    } catch {
      // Ignore storage issues.
    }
  }, [currentUser]);

  function showMessage(message) {
    setActionMessage(message);
    window.clearTimeout(window.__portalMessageTimer);
    window.__portalMessageTimer = window.setTimeout(() => setActionMessage(""), 3500);
  }

  function updateCollection(key, updater) {
    setPortalData((previous) => ({ ...previous, [key]: typeof updater === "function" ? updater(previous[key] || []) : updater }));
  }

  async function loadPortalData() {
    setLoading(true);
    try {
      const [dashboard, users, faculty, rooms, timetables, attendance, issues, feedback, notifications, courses, holidays, contactMessages] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/users"),
        api.get("/faculty"),
        api.get("/rooms"),
        api.get("/timetables"),
        api.get("/attendance"),
        api.get("/issues"),
        api.get("/feedback"),
        api.get("/notifications"),
        api.get("/courses"),
        api.get("/holidays"),
        api.get("/contact-messages"),
      ]);
      setPortalData({
        dashboard: dashboard.data,
        users: users.data,
        faculty: faculty.data,
        rooms: rooms.data,
        timetables: timetables.data,
        attendance: attendance.data,
        issues: issues.data,
        feedback: feedback.data,
        notifications: notifications.data,
        courses: courses.data,
        holidays: holidays.data,
        contactMessages: contactMessages.data,
      });
    } catch {
      setPortalData(emptyPortalData);
      showMessage("Unable to reach backend services right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentAccess(mode) {
    try {
      if (mode === "signup") {
        const response = await api.post("/users/signup", { ...studentAuthForm, role: "student" });
        setCurrentUser(response.data.user);
        updateCollection("users", (items) => [response.data.user, ...items]);
        setStudentAuthForm(emptyStudentAuthForm);
        showMessage("Student account created successfully.");
        return;
      }

      const response = await api.post("/users/signin", { email: studentAuthForm.email, password: studentAuthForm.password });
      if (response.data.user.role !== "student") {
        return showMessage("Use the hidden lecturer key or admin lock for non-student accounts.");
      }
      setCurrentUser(response.data.user);
      showMessage(`Welcome back, ${response.data.user.name}.`);
    } catch (error) {
      showMessage(error.response?.data?.error || "Authentication failed.");
    }
  }

  async function handleLecturerAccess(mode, navigate) {
    try {
      if (mode === "signup") {
        await api.post("/users/signup", {
          ...lecturerAuthForm,
          role: "lecturer",
          staffId: lecturerAuthForm.staffId.toUpperCase(),
          section: lecturerAuthForm.section.toUpperCase(),
        });
        setLecturerAuthForm(emptyLecturerAuthForm);
        showMessage("Lecturer signup submitted. Admin approval is required before login.");
        return;
      }

      const response = await api.post("/users/signin", {
        email: lecturerAuthForm.email,
        password: lecturerAuthForm.password,
      });
      if (response.data.user.role !== "lecturer") {
        return showMessage("This account is not a lecturer account.");
      }
      setCurrentUser(response.data.user);
      showMessage(`Welcome, ${response.data.user.name}.`);
      navigate("/attendance");
    } catch (error) {
      showMessage(error.response?.data?.error || "Lecturer authentication failed.");
    }
  }

  async function handleAdminAccess(email, password, navigate) {
    try {
      const response = await api.post("/users/signin", { email, password });
      if (response.data.user.role !== "admin") {
        return showMessage("This account does not have admin access.");
      }
      setCurrentUser(response.data.user);
      showMessage("Admin access granted.");
      navigate("/admin/dashboard");
    } catch (error) {
      showMessage(error.response?.data?.error || "Admin sign in failed.");
    }
  }

  async function submitRecord(collection, url, payload, reset) {
    try {
      const response = await api.post(url, payload);
      updateCollection(collection, (items) => [response.data, ...(items || [])]);
      reset();
      showMessage("Saved successfully.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to save record.");
    }
  }

  async function handleIssueStatusChange(issueId, status) {
    try {
      const replyText = {
        received: "Your issue has been received by the admin team.",
        contacted: "The admin team has contacted or is following up on this issue.",
        solved: "This issue has been marked as solved by the admin team.",
      };
      const response = await api.put(`/issues/${issueId}`, { status, adminReply: replyText[status] || "" });
      updateCollection("issues", (items) => items.map((issue) => (issue._id === issueId ? response.data : issue)));
      showMessage("Issue status updated.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to update issue.");
    }
  }

  async function handleFeedbackStatusChange(feedbackId, status) {
    try {
      const response = await api.put(`/feedback/${feedbackId}`, { status });
      updateCollection("feedback", (items) => items.map((item) => (item._id === feedbackId ? response.data : item)));
      showMessage("Feedback status updated.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to update feedback.");
    }
  }

  async function handleContactStatusChange(messageId, status) {
    try {
      const response = await api.put(`/contact-messages/${messageId}`, { status });
      updateCollection("contactMessages", (items) => items.map((item) => (item._id === messageId ? response.data : item)));
      showMessage("Contact message updated.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to update contact message.");
    }
  }

  async function handleTimetableGenerate(event) {
    event.preventDefault();
    try {
      const response = await api.post("/timetables/generate", timetableForm);
      updateCollection("timetables", (items) => [response.data, ...(items || [])]);
      showMessage("Timetable generated for Monday to Saturday with Sunday special support.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to generate timetable.");
    }
  }

  async function handleCreateStudent(event) {
    event.preventDefault();
    try {
      const response = await api.post("/users/signup", studentForm);
      updateCollection("users", (items) => [response.data.user, ...(items || [])]);
      setStudentForm(emptyStudentForm);
      showMessage("Student added and available for attendance.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to add student.");
    }
  }

  async function handleCreateHoliday(event) {
    event.preventDefault();
    try {
      const response = await api.post("/attendance/holiday", { ...holidayForm, markedBy: currentUser?.name || "Admin" });
      await loadPortalData();
      setHolidayForm(emptyHolidayForm);
      showMessage("Holiday created and full attendance applied.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to create holiday attendance.");
    }
  }

  async function handleBulkAttendanceSubmit(records) {
    try {
      await api.post("/attendance/bulk", { records });
      await loadPortalData();
      setAttendanceRefreshToken((value) => value + 1);
      showMessage("Daily attendance saved successfully.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to save daily attendance.");
    }
  }

  async function handleUserStatusChange(userId, status) {
    try {
      const response = await api.put(`/users/${userId}`, {
        status,
        approvedBy: currentUser?.name || "Admin",
      });
      updateCollection("users", (items) => items.map((item) => (item._id === userId ? response.data.user : item)));
      showMessage(status === "active" ? "Lecturer approved successfully." : "Lecturer status updated.");
      await loadPortalData();
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to update lecturer approval.");
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    await submitRecord("contactMessages", "/contact-messages", contactForm, () => setContactForm(emptyContactForm));
  }

  function signOut() {
    setCurrentUser(null);
    showMessage("Signed out successfully.");
  }

  const isAdmin = currentUser?.role === "admin";
  const isStudent = currentUser?.role === "student";
  const isLecturer = currentUser?.role === "lecturer";
  const visibleIssues = isAdmin ? portalData.issues || [] : (portalData.issues || []).filter((item) => item.collegeId === currentUser?.collegeId);
  const visibleFeedback = isAdmin ? portalData.feedback || [] : (portalData.feedback || []).filter((item) => item.collegeId === currentUser?.collegeId);
  const timetable = portalData.timetables?.[0] || null;
  const attendanceRate = portalData.dashboard?.kpis?.attendanceRate || Math.round((((portalData.attendance || []).filter((item) => item.status === "present").length || 0) / ((portalData.attendance || []).length || 1)) * 100);
  const routeContent = (
    <Routes>
      <Route path="/" element={<HomePage portalData={portalData} timetable={timetable} attendanceRate={attendanceRate} currentUser={currentUser} />} />
      <Route path="/scheduler" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <RestrictedCard title="Scheduler access is reserved for admin workflow." description="Use the lock in Contact / Help to open the real dashboard, courses, faculty, rooms, timetables, and notifications workspace." />} />
      <Route path="/attendance" element={<ProtectedPage allowed={isAdmin || isLecturer} title="Attendance management is available for approved staff only." description="Lecturers can mark attendance for scheduled periods, and admins can manage roster-level attendance.">{isAdmin ? <AttendanceSection attendance={portalData.attendance || []} users={portalData.users || []} holidays={portalData.holidays || []} handleBulkAttendanceSubmit={handleBulkAttendanceSubmit} /> : <LecturerWorkspaceSection currentUser={currentUser} onSubmitAttendance={handleBulkAttendanceSubmit} refreshToken={attendanceRefreshToken} showMessage={showMessage} />}</ProtectedPage>} />
      <Route path="/complaints" element={<ProtectedPage allowed={isStudent || isAdmin} title="Student issue desk" description="Students can raise complaints after signing in, and the admin team can resolve them from the portal."><IssuesSection issueForm={issueForm} setIssueForm={setIssueForm} issues={visibleIssues} currentUser={currentUser} submitRecord={submitRecord} isAdmin={isAdmin} handleIssueStatusChange={handleIssueStatusChange} emptyIssueForm={emptyIssueForm} /></ProtectedPage>} />
      <Route path="/feedback" element={<ProtectedPage allowed={isStudent || isAdmin} title="Lecturer feedback" description="Signed-in students can rate lecturers and send structured feedback."><FeedbackSection feedbackForm={feedbackForm} setFeedbackForm={setFeedbackForm} feedback={visibleFeedback} currentUser={currentUser} submitRecord={submitRecord} emptyFeedbackForm={emptyFeedbackForm} faculty={portalData.faculty || []} /></ProtectedPage>} />
      <Route path="/contact" element={<ContactPage contactForm={contactForm} setContactForm={setContactForm} handleContactSubmit={handleContactSubmit} />} />
      <Route path="/student-access" element={<StudentAccessPage authMode={studentAuthMode} setAuthMode={setStudentAuthMode} authForm={studentAuthForm} setAuthForm={setStudentAuthForm} handleStudentAccess={handleStudentAccess} currentUser={currentUser} />} />
      <Route path="/lecturer-access" element={<LecturerAccessPage authMode={lecturerAuthMode} setAuthMode={setLecturerAuthMode} authForm={lecturerAuthForm} setAuthForm={setLecturerAuthForm} handleLecturerAccess={handleLecturerAccess} currentUser={currentUser} />} />
      <Route path="/admin-access" element={<AdminAccessPage onSubmit={handleAdminAccess} />} />
      <Route path="/lecturer-portal" element={isLecturer ? <Navigate to="/attendance" replace /> : <RestrictedCard title="Lecturer access is protected." description="Use the hidden staff key from Contact / Help to sign in after admin approval." />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<ProtectedPage allowed={isAdmin} title="Admin dashboard" description="Only signed-in admins can access the workspace behind the contact-page lock."><DashboardPage /></ProtectedPage>} />
      <Route path="/admin/courses" element={<ProtectedPage allowed={isAdmin} title="Courses management" description="Only signed-in admins can manage scheduler resources."><CoursesPage /></ProtectedPage>} />
      <Route path="/admin/faculty" element={<ProtectedPage allowed={isAdmin} title="Faculty management" description="Only signed-in admins can manage scheduler resources."><FacultyPage /></ProtectedPage>} />
      <Route path="/admin/rooms" element={<ProtectedPage allowed={isAdmin} title="Room management" description="Only signed-in admins can manage scheduler resources."><RoomsPage /></ProtectedPage>} />
      <Route path="/admin/timetables" element={<ProtectedPage allowed={isAdmin} title="Timetable management" description="Only signed-in admins can manage scheduler resources."><TimetablePage /></ProtectedPage>} />
      <Route path="/admin/notifications" element={<ProtectedPage allowed={isAdmin} title="Notification management" description="Only signed-in admins can manage scheduler resources."><NotificationsPage /></ProtectedPage>} />
      <Route path="/admin/operations" element={<ProtectedPage allowed={isAdmin} title="Admin operations center" description="Student management, holiday attendance, support inbox, feedback, lecturer approval, and issue resolution."><AdminSection lecturerForm={lecturerForm} setLecturerForm={setLecturerForm} studentForm={studentForm} setStudentForm={setStudentForm} holidayForm={holidayForm} setHolidayForm={setHolidayForm} courseForm={courseForm} setCourseForm={setCourseForm} roomForm={roomForm} setRoomForm={setRoomForm} faculty={portalData.faculty || []} users={portalData.users || []} courses={portalData.courses || []} rooms={portalData.rooms || []} issues={portalData.issues || []} feedback={portalData.feedback || []} holidays={portalData.holidays || []} attendance={portalData.attendance || []} contactMessages={portalData.contactMessages || []} dashboard={portalData.dashboard} handleCreateStudent={handleCreateStudent} handleCreateHoliday={handleCreateHoliday} submitRecord={submitRecord} emptyLecturerForm={emptyLecturerForm} emptyCourseForm={emptyCourseForm} emptyRoomForm={emptyRoomForm} handleFeedbackStatusChange={handleFeedbackStatusChange} handleIssueStatusChange={handleIssueStatusChange} handleContactStatusChange={handleContactStatusChange} handleUserStatusChange={handleUserStatusChange} /></ProtectedPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (location.pathname.startsWith("/admin/")) {
    return (
      <>
        {actionMessage ? <div className="fixed left-4 right-4 top-4 z-50 rounded-2xl border border-sky-100 bg-white/95 px-4 py-3 text-sm font-medium text-sky-800 shadow-xl backdrop-blur-sm md:left-auto md:right-4 md:w-[420px]">{actionMessage}</div> : null}
        {routeContent}
        {loading ? <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/20 backdrop-blur-sm"><div className="rounded-3xl border border-slate-700/50 bg-slate-900/90 px-8 py-5 text-sm font-semibold text-cyan-200 shadow-2xl">Loading admin workspace...</div></div> : null}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fbff_45%,#eef6ff_100%)] text-slate-900">
      <div className="ambient-shape ambient-shape-left" />
      <div className="ambient-shape ambient-shape-right" />
      <div className="mx-auto max-w-[1480px] px-4 pb-10 pt-4 md:px-6 lg:px-8">
        <Header currentUser={currentUser} signOut={signOut} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        {actionMessage ? <div className="status-banner">{actionMessage}</div> : null}
        {routeContent}
      </div>
      {loading ? <div className="fixed inset-0 grid place-items-center bg-slate-950/10 backdrop-blur-sm"><div className="rounded-3xl border border-white/80 bg-white px-8 py-5 text-sm font-semibold text-sky-800 shadow-2xl">Loading MCA campus workspace...</div></div> : null}
    </div>
  );
}

function Header({ currentUser, signOut, menuOpen, setMenuOpen }) {
  return (
    <header className="sticky top-3 z-30 rounded-[32px] border border-white/80 bg-white/80 px-4 py-4 shadow-[0_18px_50px_rgba(14,116,255,0.1)] backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_100%)] text-sm font-bold tracking-[0.2em] text-white">MCA</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">Smart Campus</p>
            <h1 className="text-xl font-semibold text-slate-950">BlueBoard Portal</h1>
          </div>
        </Link>
        <button type="button" className="secondary-button px-3 py-2 lg:hidden" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        <nav className={`${menuOpen ? "flex" : "hidden"} absolute left-4 right-4 top-[92px] flex-col gap-2 rounded-[28px] border border-sky-100 bg-white p-4 shadow-[0_22px_50px_rgba(15,23,42,0.1)] lg:static lg:flex lg:flex-row lg:items-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {publicNav.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-medium no-underline transition ${isActive ? "bg-sky-100 text-sky-800" : "text-slate-600 hover:bg-sky-50 hover:text-sky-800"}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {currentUser ? <span className="pill">{currentUser.name}</span> : <Link className="secondary-button no-underline" to="/student-access">Sign in</Link>}
          {currentUser?.role === "admin" ? <Link className="secondary-button no-underline" to="/admin/dashboard">Admin workspace</Link> : null}
          {currentUser?.role === "lecturer" ? <Link className="secondary-button no-underline" to="/attendance">Lecturer workspace</Link> : null}
          {currentUser ? <button type="button" className="primary-button" onClick={signOut}>Sign out</button> : null}
        </div>
      </div>
    </header>
  );
}

function HomePage({ portalData, timetable, attendanceRate, currentUser }) {
  return (
    <div className="grid gap-6 pt-6">
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="hero-card">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-sm font-medium text-sky-700"><BadgeCheck size={16} />Professional blue-and-white campus workspace</div>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">One MCA portal for timetable scheduling, attendance, complaints, lecturer feedback, and admin control.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">Students sign in with a unique college ID, send issues, and give lecturer ratings. Admins manage departments, sections, lecturers, classrooms, holidays, and AI-assisted timetables in a cleaner multi-page experience for mobile, laptop, and larger screens.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="primary-button no-underline" to="/scheduler">Open timetable scheduler<ArrowRight size={16} /></Link>
            <Link className="secondary-button no-underline" to="/student-access">Student sign in</Link>
          </div>
        </div>
        <SectionCard title="Live campus snapshot" description="A sharper home dashboard without exposed backend links or developer details.">
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniPanel title="Students" value={portalData.dashboard?.kpis?.totalStudents || portalData.users?.length || 0} subtitle="Active student records" />
            <MiniPanel title="Lecturers" value={portalData.dashboard?.kpis?.totalLecturers || portalData.faculty?.length || 0} subtitle="Teaching staff managed" />
            <MiniPanel title="Attendance" value={`${attendanceRate}%`} subtitle="Recorded participation rate" />
            <MiniPanel title="Open support" value={portalData.dashboard?.kpis?.openIssues || portalData.issues?.length || 0} subtitle="Complaints needing action" />
          </div>
          <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Current user</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{currentUser?.name || "Guest visitor"}</p>
            <p className="mt-2 text-sm text-slate-500">{currentUser ? `${currentUser.role} access is active.` : "Use student login or the admin lock to enter a secured workspace."}</p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="AI timetable" value="Mon-Sat" subtitle="Optional Sunday special class support" icon={CalendarDays} />
        <StatCard title="Attendance" value="Daily" subtitle="Roster-based attendance by department and section" icon={ClipboardCheck} />
        <StatCard title="Complaints" value="Tracked" subtitle="Students can raise issues and follow resolution" icon={Bell} />
        <StatCard title="Lecturer feedback" value="Rated" subtitle="Students can review the lecturers who teach them" icon={MessageSquareQuote} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <FeatureCard icon={BookOpen} title="Time table scheduler" description="Create courses, lecturers, classrooms, and generate a useful weekly timetable with AI-assisted planning." />
        <FeatureCard icon={ClipboardCheck} title="Attendance manager" description="Take daily attendance from a real student roster and apply full attendance on admin-declared holidays." />
        <FeatureCard icon={ShieldCheck} title="Secure admin access" description="Admin stays behind a lock entry from the help page so the public site remains clean and professional." />
      </section>

      <SectionCard title={timetable?.name || "Weekly timetable preview"} description="Students and staff can scan the latest timetable quickly on any device.">
        <div className="overflow-x-auto">
          <div className="grid min-w-[820px] grid-cols-7 gap-3">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <div key={day} className="rounded-3xl border border-sky-100 bg-sky-50/60 p-3">
                <div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-semibold text-slate-950">{day}</h4>{day === "Sunday" ? <span className="pill">Special</span> : null}</div>
                <div className="space-y-3">
                  {(timetable?.schedule || []).filter((entry) => entry.day === day).map((entry, index) => (
                    <div key={`${day}-${index}`} className="slot-card">
                      <p className="text-sm font-semibold text-slate-950">{entry.courseName}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.timeSlot}</p>
                      <p className="mt-2 text-xs text-slate-600">{entry.facultyName}</p>
                      <p className="text-xs text-slate-500">{entry.roomName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ContactPage({ contactForm, setContactForm, handleContactSubmit }) {
  return (
    <div className="grid gap-6 pt-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Contact and help desk" description="Students, lecturers, and visitors can send support messages directly to the admin portal.">
        <div className="space-y-4">
          <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
            <div className="flex items-center gap-3 text-sky-800"><Phone size={18} /><span className="font-semibold">9515022680</span></div>
            <div className="mt-3 flex items-center gap-3 text-sky-800"><Mail size={18} /><span className="font-semibold">manoharbasappagari18@gmail.com</span></div>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Admin lock</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">The admin portal is hidden from the public menu. Use the secure lock below to open the admin sign-in page.</p>
            <Link className="primary-button mt-4 no-underline" to="/admin-access"><LockKeyhole size={16} />Open admin lock</Link>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Lecturer key</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Lecturers use this hidden key to sign up with staff details and log in only after admin approval.</p>
            <Link className="secondary-button mt-4 no-underline" to="/lecturer-access"><LockKeyhole size={16} />Open lecturer access</Link>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Send a message" description="Your phone number, email, college ID, and message will appear in the admin portal support inbox.">
        <form className="grid gap-3" onSubmit={handleContactSubmit}>
          <InputField label="Full name" value={contactForm.name} onChange={(value) => setContactForm({ ...contactForm, name: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Email" type="email" value={contactForm.email} onChange={(value) => setContactForm({ ...contactForm, email: value })} />
            <InputField label="Phone number" value={contactForm.phone} onChange={(value) => setContactForm({ ...contactForm, phone: value })} />
          </div>
          <InputField label="College ID" value={contactForm.collegeId} onChange={(value) => setContactForm({ ...contactForm, collegeId: value.toUpperCase() })} />
          <TextAreaField label="Message" value={contactForm.message} onChange={(value) => setContactForm({ ...contactForm, message: value })} />
          <button type="submit" className="primary-button justify-center">Send to admin portal</button>
        </form>
      </SectionCard>
    </div>
  );
}

function StudentAccessPage({ authMode, setAuthMode, authForm, setAuthForm, handleStudentAccess, currentUser }) {
  return (
    <div className="grid gap-6 pt-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Student portal access" description="Students sign up with a unique college ID and then use the portal for feedback, complaints, and campus updates.">
        <div className="space-y-4">
          <FeatureCard icon={ShieldCheck} title="Unique college ID" description="If a college ID is already registered, the platform will reject duplicate sign-ups." />
          <FeatureCard icon={MessageSquareQuote} title="Lecturer feedback" description="Students can rate lecturers based on the subjects assigned by admin." />
          <FeatureCard icon={Bell} title="Complaint support" description="Raise attendance, timetable, academic, or facility issues directly from the website." />
        </div>
      </SectionCard>

      <SectionCard title={authMode === "signin" ? "Sign in" : "Create student account"} description="Clean student access for mobile and laptop devices.">
        <div className="segmented-control">
          <button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>Sign in</button>
          <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Sign up</button>
        </div>
        <form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); handleStudentAccess(authMode); }}>
          {authMode === "signup" ? <InputField label="Full name" value={authForm.name} onChange={(value) => setAuthForm({ ...authForm, name: value })} /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Email" type="email" value={authForm.email} onChange={(value) => setAuthForm({ ...authForm, email: value })} />
            <InputField label="Password" type="password" value={authForm.password} onChange={(value) => setAuthForm({ ...authForm, password: value })} />
          </div>
          {authMode === "signup" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <InputField label="College ID" value={authForm.collegeId} onChange={(value) => setAuthForm({ ...authForm, collegeId: value.toUpperCase() })} />
                <InputField label="Phone" value={authForm.phone || ""} onChange={(value) => setAuthForm({ ...authForm, phone: value })} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InputField label="Department" value={authForm.department} onChange={(value) => setAuthForm({ ...authForm, department: value })} />
                <InputField label="Semester" type="number" value={authForm.semester} onChange={(value) => setAuthForm({ ...authForm, semester: Number(value) })} />
                <InputField label="Section" value={authForm.section} onChange={(value) => setAuthForm({ ...authForm, section: value.toUpperCase() })} />
              </div>
            </>
          ) : null}
          <button type="submit" className="primary-button justify-center">{authMode === "signin" ? "Enter student portal" : "Create student account"}</button>
        </form>
        {currentUser ? <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-950">{currentUser.name}</span>.</div> : null}
      </SectionCard>
    </div>
  );
}

function LecturerAccessPage({ authMode, setAuthMode, authForm, setAuthForm, handleLecturerAccess, currentUser }) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 pt-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Lecturer access" description="Lecturers sign up with staff details, wait for admin approval, and then log in to mark attendance for scheduled classes.">
        <div className="space-y-4">
          <FeatureCard icon={LockKeyhole} title="Approval workflow" description="A lecturer account stays pending until the admin approves it from the operations dashboard." />
          <FeatureCard icon={ClipboardCheck} title="Attendance by timetable" description="Approved lecturers see the periods assigned to them and mark attendance from the scheduled department and section." />
          <FeatureCard icon={BookOpen} title="Mapped teaching data" description="Admin links lecturers to departments, sections, and subjects so student feedback stays staff-specific." />
        </div>
      </SectionCard>

      <SectionCard title={authMode === "signin" ? "Lecturer sign in" : "Request lecturer access"} description="Hidden staff access built for internal college use.">
        <div className="segmented-control">
          <button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>Sign in</button>
          <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Sign up</button>
        </div>
        <form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); handleLecturerAccess(authMode, navigate); }}>
          {authMode === "signup" ? <InputField label="Lecturer name" value={authForm.name} onChange={(value) => setAuthForm({ ...authForm, name: value })} /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Email" type="email" value={authForm.email} onChange={(value) => setAuthForm({ ...authForm, email: value })} />
            <InputField label="Password" type="password" value={authForm.password} onChange={(value) => setAuthForm({ ...authForm, password: value })} />
          </div>
          {authMode === "signup" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <InputField label="Staff ID" value={authForm.staffId} onChange={(value) => setAuthForm({ ...authForm, staffId: value.toUpperCase() })} />
                <InputField label="Phone" value={authForm.phone} onChange={(value) => setAuthForm({ ...authForm, phone: value })} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InputField label="Qualification" value={authForm.qualification} onChange={(value) => setAuthForm({ ...authForm, qualification: value })} />
                <InputField label="Department" value={authForm.department} onChange={(value) => setAuthForm({ ...authForm, department: value })} />
                <InputField label="Section" value={authForm.section} onChange={(value) => setAuthForm({ ...authForm, section: value.toUpperCase() })} />
              </div>
            </>
          ) : null}
          <button type="submit" className="primary-button justify-center">{authMode === "signin" ? "Enter lecturer workspace" : "Submit lecturer approval request"}</button>
        </form>
        {currentUser?.role === "lecturer" ? <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-950">{currentUser.name}</span>.</div> : null}
      </SectionCard>
    </div>
  );
}

function AdminAccessPage({ onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <div className="mx-auto grid max-w-3xl gap-6 pt-6">
      <SectionCard title="Admin portal lock" description="Secure sign-in for the admin-only workspace.">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(form.email, form.password, navigate); }}>
          <InputField label="Admin email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <InputField label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
          <div className="md:col-span-2">
            <button type="submit" className="primary-button justify-center">Unlock admin portal</button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

function ProtectedPage({ allowed, title, description, children }) {
  if (!allowed) {
    return <div className="pt-6"><RestrictedCard title={title} description={description} /></div>;
  }
  return <div className="pt-6">{children}</div>;
}

function RestrictedCard({ title, description }) {
  return (
    <SectionCard title={title} description={description}>
      <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
        <p className="text-sm leading-7 text-slate-600">Use student login for complaints and lecturer feedback. For staff workflows, open the lecturer key or admin lock from the Contact / Help page.</p>
      </div>
    </SectionCard>
  );
}
