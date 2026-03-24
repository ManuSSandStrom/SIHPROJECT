import { useEffect, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { AdminSection } from "./components/AdminSection";
import { AttendanceSection } from "./components/AttendanceSection";
import { FeedbackSection } from "./components/FeedbackSection";
import { IssuesSection } from "./components/IssuesSection";
import { OverviewSection } from "./components/OverviewSection";
import { InfoChip, InputField, SelectField, StatCard } from "./components/PortalUI";
import { TimetableSection } from "./components/TimetableSection";
import { demoPortalData, generateDemoTimetable } from "./lib/demoData";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const api = axios.create({ baseURL: `${API_BASE_URL}/api`, timeout: 8000 });

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "timetable", label: "Timetable", icon: BookOpen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "issues", label: "Issues", icon: AlertCircle },
  { id: "feedback", label: "Feedback", icon: MessageSquareQuote },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

const emptyAuthForm = { name: "", email: "", password: "", collegeId: "", department: "Computer Science", semester: 5, section: "A", role: "student" };
const emptyIssueForm = { title: "", description: "", category: "academic", priority: "medium" };
const emptyFeedbackForm = { title: "", category: "platform", rating: 5, lecturerId: "", lecturerName: "", message: "" };
const emptyLecturerForm = { name: "", email: "", employeeId: "", department: "Computer Science", designation: "Lecturer", phone: "", officeLocation: "", specialization: "AI, Data Structures", assignedSubjectName: "", assignedCourseCode: "", assignedSemester: 5, assignedSection: "A" };
const emptyStudentForm = { name: "", email: "", password: "Student@123", collegeId: "", department: "Computer Science", semester: 5, section: "A", role: "student" };
const emptyHolidayForm = { title: "", description: "", date: new Date().toISOString().slice(0, 10), department: "Computer Science", section: "A" };
const emptyTimetableForm = { department: "Computer Science", semester: 5, academicYear: new Date().getFullYear(), includeSundaySpecialClass: true };

function App() {
  const [portalData, setPortalData] = useState(demoPortalData);
  const [activeSection, setActiveSection] = useState("overview");
  const [authMode, setAuthMode] = useState("signin");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedbackForm);
  const [lecturerForm, setLecturerForm] = useState(emptyLecturerForm);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [holidayForm, setHolidayForm] = useState(emptyHolidayForm);
  const [timetableForm, setTimetableForm] = useState(emptyTimetableForm);
  const [currentUser, setCurrentUser] = useState(demoPortalData.currentUser);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  function showMessage(message) {
    setActionMessage(message);
    window.clearTimeout(window.__portalMessageTimer);
    window.__portalMessageTimer = window.setTimeout(() => setActionMessage(""), 3500);
  }

  function updateCollection(key, updater) {
    setPortalData((previous) => ({ ...previous, [key]: typeof updater === "function" ? updater(previous[key]) : updater }));
  }

  async function loadPortalData() {
    setLoading(true);
    try {
      const [dashboard, users, faculty, timetables, attendance, issues, feedback, notifications, courses, holidays] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/users"),
        api.get("/faculty"),
        api.get("/timetables"),
        api.get("/attendance"),
        api.get("/issues"),
        api.get("/feedback"),
        api.get("/notifications"),
        api.get("/courses"),
        api.get("/holidays"),
      ]);
      setPortalData({ dashboard: dashboard.data, users: users.data, faculty: faculty.data, timetables: timetables.data, attendance: attendance.data, issues: issues.data, feedback: feedback.data, notifications: notifications.data, courses: courses.data, holidays: holidays.data, currentUser: demoPortalData.currentUser });
      setDemoMode(false);
    } catch (_error) {
      setPortalData(demoPortalData);
      setDemoMode(true);
      showMessage("Live API not reachable, so the portal is running in demo mode.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    try {
      if (authMode === "signup") {
        if (demoMode) {
          const duplicate = portalData.users.some((item) => item.collegeId === authForm.collegeId.trim().toUpperCase());
          if (duplicate) return showMessage("That college ID is already registered.");
          const created = { _id: String(Date.now()), name: authForm.name, email: authForm.email.toLowerCase(), role: authForm.role, collegeId: authForm.collegeId.trim().toUpperCase(), department: authForm.department, semester: Number(authForm.semester), section: authForm.section };
          updateCollection("users", (items) => [created, ...items]);
          setCurrentUser(created);
          return showMessage("Account created successfully.");
        }
        const response = await api.post("/users/signup", authForm);
        setCurrentUser(response.data.user);
        updateCollection("users", (items) => [response.data.user, ...items]);
        return showMessage("Account created successfully.");
      }

      if (demoMode) {
        const user = portalData.users.find((item) => item.email === authForm.email.toLowerCase()) || demoPortalData.currentUser;
        setCurrentUser(user);
        return showMessage(`Welcome back, ${user.name}.`);
      }

      const response = await api.post("/users/signin", { email: authForm.email, password: authForm.password });
      setCurrentUser(response.data.user);
      showMessage(`Welcome back, ${response.data.user.name}.`);
    } catch (error) {
      showMessage(error.response?.data?.error || "Authentication failed.");
    }
  }

  async function submitRecord(collection, url, payload, reset) {
    try {
      if (demoMode) {
        updateCollection(collection, (items) => [{ ...payload, _id: String(Date.now()), createdAt: new Date().toISOString() }, ...items]);
      } else {
        const response = await api.post(url, payload);
        updateCollection(collection, (items) => [response.data, ...items]);
      }
      reset();
      showMessage("Saved successfully.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to save record.");
    }
  }

  async function handleIssueStatusChange(issueId, status) {
    try {
      if (demoMode) {
        updateCollection("issues", (items) => items.map((issue) => (issue._id === issueId ? { ...issue, status } : issue)));
      } else {
        const response = await api.put(`/issues/${issueId}`, { status });
        updateCollection("issues", (items) => items.map((issue) => (issue._id === issueId ? response.data : issue)));
      }
      showMessage("Issue status updated.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to update issue.");
    }
  }

  async function handleFeedbackStatusChange(feedbackId, status) {
    try {
      if (demoMode) {
        updateCollection("feedback", (items) => items.map((item) => (item._id === feedbackId ? { ...item, status } : item)));
      } else {
        const response = await api.put(`/feedback/${feedbackId}`, { status });
        updateCollection("feedback", (items) => items.map((item) => (item._id === feedbackId ? response.data : item)));
      }
      showMessage("Feedback status updated.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to update feedback.");
    }
  }

  async function handleTimetableGenerate(event) {
    event.preventDefault();
    try {
      if (demoMode) {
        updateCollection("timetables", (items) => [generateDemoTimetable(timetableForm, portalData.courses, portalData.faculty), ...items]);
      } else {
        const response = await api.post("/timetables/generate", timetableForm);
        updateCollection("timetables", (items) => [response.data, ...items]);
      }
      showMessage("Timetable generated for Monday to Saturday with Sunday special support.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to generate timetable.");
    }
  }

  async function handleCreateStudent(event) {
    event.preventDefault();
    try {
      if (demoMode) {
        const created = { ...studentForm, _id: String(Date.now()), createdAt: new Date().toISOString() };
        updateCollection("users", (items) => [created, ...items]);
      } else {
        const response = await api.post("/users/signup", studentForm);
        updateCollection("users", (items) => [response.data.user, ...items]);
      }
      setStudentForm(emptyStudentForm);
      showMessage("Student added and available for attendance.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to add student.");
    }
  }

  async function handleCreateHoliday(event) {
    event.preventDefault();
    try {
      if (demoMode) {
        const holiday = { ...holidayForm, _id: String(Date.now()) };
        const matchingStudents = portalData.users.filter((user) => user.role === "student" && user.department === holidayForm.department && user.section === holidayForm.section);
        const records = matchingStudents.map((student) => ({
          _id: `${student._id}-${holidayForm.date}`,
          studentId: student._id,
          studentName: student.name,
          collegeId: student.collegeId,
          department: student.department,
          section: student.section,
          semester: student.semester,
          courseCode: "HOLIDAY",
          courseName: "Holiday Attendance",
          facultyName: "Administration",
          date: holidayForm.date,
          slotLabel: "Holiday",
          sessionType: "special",
          status: "present",
          isHoliday: true,
          holidayTitle: holidayForm.title,
        }));
        updateCollection("holidays", (items) => [holiday, ...items]);
        updateCollection("attendance", (items) => [...records, ...items]);
      } else {
        const response = await api.post("/attendance/holiday", {
          ...holidayForm,
          markedBy: currentUser?.name || "Admin",
        });
        updateCollection("holidays", (items) => [response.data.holiday, ...items]);
        await loadPortalData();
      }
      setHolidayForm(emptyHolidayForm);
      showMessage("Holiday created and full attendance applied.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to create holiday attendance.");
    }
  }

  async function handleBulkAttendanceSubmit(records) {
    try {
      if (demoMode) {
        updateCollection("attendance", (items) => [...records.map((record) => ({ ...record, _id: `${record.studentId}-${Date.now()}` })), ...items]);
      } else {
        const response = await api.post("/attendance/bulk", { records });
        updateCollection("attendance", (items) => [...response.data, ...items]);
      }
      showMessage("Daily attendance saved successfully.");
    } catch (error) {
      showMessage(error.response?.data?.error || "Unable to save daily attendance.");
    }
  }

  const isAdmin = currentUser?.role === "admin";
  const visibleIssues = isAdmin ? portalData.issues : portalData.issues.filter((item) => item.collegeId === currentUser?.collegeId);
  const visibleFeedback = isAdmin ? portalData.feedback : portalData.feedback.filter((item) => item.collegeId === currentUser?.collegeId);
  const timetable = portalData.timetables[0] || demoPortalData.timetables[0];
  const attendanceRate = portalData.dashboard?.kpis?.attendanceRate || Math.round(((portalData.attendance.filter((item) => item.status === "present").length || 0) / (portalData.attendance.length || 1)) * 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#d9ebff_0%,#f8fbff_48%,#eef5ff_100%)] text-slate-900">
      <div className="ambient-shape ambient-shape-left" />
      <div className="ambient-shape ambient-shape-right" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className={`portal-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          <SidebarHeader currentUser={currentUser} demoMode={demoMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection={activeSection} setActiveSection={setActiveSection} isAdmin={isAdmin} />
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="glass-panel animate-rise">
            <HeaderRow notifications={portalData.notifications.length} />
            {actionMessage ? <div className="status-banner">{actionMessage}</div> : null}
            <HeroSection authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} handleAuthSubmit={handleAuthSubmit} isAdmin={isAdmin} setActiveSection={setActiveSection} />

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Students" value={portalData.dashboard?.kpis?.totalStudents || portalData.users.length} subtitle="Registered learner accounts" icon={Users} />
              <StatCard title="Lecturers" value={portalData.dashboard?.kpis?.totalLecturers || portalData.faculty.length} subtitle="Managed from admin portal" icon={UserCog} />
              <StatCard title="Attendance" value={`${attendanceRate}%`} subtitle="Tracked session participation" icon={ClipboardCheck} />
              <StatCard title="Open issues" value={portalData.dashboard?.kpis?.openIssues || portalData.issues.length} subtitle="Student support queue" icon={AlertCircle} />
            </section>

            <div className="mt-6 grid gap-6">
              {activeSection === "overview" ? <OverviewSection portalData={portalData} /> : null}
              {activeSection === "timetable" ? <TimetableSection timetable={timetable} timetableForm={timetableForm} setTimetableForm={setTimetableForm} handleTimetableGenerate={handleTimetableGenerate} days={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]} /> : null}
              {activeSection === "attendance" ? <AttendanceSection attendance={portalData.attendance} users={portalData.users} holidays={portalData.holidays || []} handleBulkAttendanceSubmit={handleBulkAttendanceSubmit} /> : null}
              {activeSection === "issues" ? <IssuesSection issueForm={issueForm} setIssueForm={setIssueForm} issues={visibleIssues} currentUser={currentUser} submitRecord={submitRecord} isAdmin={isAdmin} handleIssueStatusChange={handleIssueStatusChange} emptyIssueForm={emptyIssueForm} /> : null}
              {activeSection === "feedback" ? <FeedbackSection feedbackForm={feedbackForm} setFeedbackForm={setFeedbackForm} feedback={visibleFeedback} currentUser={currentUser} submitRecord={submitRecord} emptyFeedbackForm={emptyFeedbackForm} faculty={portalData.faculty} /> : null}
              {activeSection === "admin" && isAdmin ? <AdminSection lecturerForm={lecturerForm} setLecturerForm={setLecturerForm} studentForm={studentForm} setStudentForm={setStudentForm} holidayForm={holidayForm} setHolidayForm={setHolidayForm} faculty={portalData.faculty} users={portalData.users} issues={portalData.issues} feedback={portalData.feedback} holidays={portalData.holidays || []} attendance={portalData.attendance} dashboard={portalData.dashboard} handleCreateStudent={handleCreateStudent} handleCreateHoliday={handleCreateHoliday} submitRecord={submitRecord} emptyLecturerForm={emptyLecturerForm} handleFeedbackStatusChange={handleFeedbackStatusChange} /> : null}
            </div>
          </div>
        </main>
      </div>

      {loading ? <div className="fixed inset-0 grid place-items-center bg-slate-950/15 backdrop-blur-sm"><div className="rounded-3xl border border-white/80 bg-white px-8 py-5 text-sm font-semibold text-sky-800 shadow-2xl">Loading professional campus workspace...</div></div> : null}
    </div>
  );
}

function SidebarHeader({ currentUser, demoMode, setSidebarOpen, activeSection, setActiveSection, isAdmin }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-white/60 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">Smart Campus</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">BlueBoard Portal</h1>
        </div>
        <button type="button" className="rounded-full border border-sky-200 bg-white/80 p-2 text-sky-700 lg:hidden" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
      </div>
      <div className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_60px_rgba(14,116,255,0.12)]">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white"><ShieldCheck size={20} /></div><div><p className="font-semibold text-slate-950">{currentUser?.name || "Campus Admin"}</p><p className="text-sm text-slate-500">{currentUser?.role || "student"} portal</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2"><span className="pill">{demoMode ? "Demo mode" : "Live API"}</span><span className="pill">{CLERK_KEY ? "Clerk key loaded" : "Clerk key missing"}</span></div>
      </div>
      <nav className="mt-6 space-y-2">
        {navItems.map(({ id, label, icon: Icon }) => id === "admin" && !isAdmin ? null : <button key={id} type="button" className={`nav-link ${activeSection === id ? "active" : ""}`} onClick={() => { setActiveSection(id); setSidebarOpen(false); }}><Icon size={18} /><span>{label}</span></button>)}
      </nav>
      <div className="mt-auto rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-600 to-blue-900 p-5 text-white"><div className="flex items-center gap-2 text-sm font-medium text-sky-100"><Sparkles size={16} />AI enabled scheduling</div><p className="mt-3 text-sm leading-6 text-sky-50">Monday to Saturday planning is built in, and Sunday special classes can be enabled when needed.</p></div>
    </>
  );
}

function HeaderRow({ notifications }) {
  return (
    <header className="flex flex-col gap-4 border-b border-sky-100/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">Professional classroom operations</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Responsive student and admin platform</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">Timetables, attendance, issue handling, lecturer management, and feedback now live in one cleaner blue-and-white workspace designed for phones, laptops, and wide admin dashboards.</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><InfoChip icon={BookOpen} label="Backend" value={API_BASE_URL} /><InfoChip icon={Bell} label="Notifications" value={`${notifications} active`} /></div>
    </header>
  );
}

function HeroSection({ authMode, setAuthMode, authForm, setAuthForm, handleAuthSubmit, isAdmin, setActiveSection }) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <div className="hero-card">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700"><BadgeCheck size={16} />Campus workflows rebuilt for clarity</div>
          <h3 className="mt-5 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">One portal for timetable planning, attendance, student support, and admin control.</h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">Students can sign up with a unique college ID, raise issues, track attendance, and share feedback. Admins can add lecturers, monitor queues, and keep schedules aligned.</p>
          <div className="mt-6 flex flex-wrap gap-3"><button type="button" className="primary-button" onClick={() => setActiveSection("timetable")}>Open smart timetable<ArrowRight size={16} /></button><button type="button" className="secondary-button" onClick={() => setActiveSection(isAdmin ? "admin" : "issues")}>Open workflow center</button></div>
        </div>
      </div>
      <div className="auth-card">
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Portal access</p><h3 className="mt-2 text-2xl font-semibold text-slate-950">{authMode === "signin" ? "Sign in" : "Create account"}</h3></div>
          <div className="segmented-control"><button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>Sign in</button><button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Sign up</button></div>
        </div>
        <form className="mt-5 grid gap-3" onSubmit={handleAuthSubmit}>
          {authMode === "signup" ? <><InputField label="Full name" value={authForm.name} onChange={(value) => setAuthForm({ ...authForm, name: value })} /><div className="grid gap-3 md:grid-cols-2"><InputField label="College ID" value={authForm.collegeId} onChange={(value) => setAuthForm({ ...authForm, collegeId: value.toUpperCase() })} /><SelectField label="Role" value={authForm.role} onChange={(value) => setAuthForm({ ...authForm, role: value })} options={[{ label: "Student", value: "student" }, { label: "Admin", value: "admin" }]} /></div></> : null}
          <InputField label="Email" type="email" value={authForm.email} onChange={(value) => setAuthForm({ ...authForm, email: value })} />
          <InputField label="Password" type="password" value={authForm.password} onChange={(value) => setAuthForm({ ...authForm, password: value })} />
          {authMode === "signup" ? <div className="grid gap-3 md:grid-cols-3"><InputField label="Department" value={authForm.department} onChange={(value) => setAuthForm({ ...authForm, department: value })} /><InputField label="Semester" type="number" value={authForm.semester} onChange={(value) => setAuthForm({ ...authForm, semester: value })} /><InputField label="Section" value={authForm.section} onChange={(value) => setAuthForm({ ...authForm, section: value })} /></div> : null}
          <button type="submit" className="primary-button w-full justify-center">{authMode === "signin" ? "Enter portal" : "Register with unique ID"}</button>
        </form>
        <div className="mt-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-950">Admin login</p>
          <p className="mt-1">Email: `admin@blueboard.edu`</p>
          <p>Password: `Admin@123`</p>
        </div>
      </div>
    </section>
  );
}

export default App;
