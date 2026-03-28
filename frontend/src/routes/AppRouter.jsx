import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { PublicShell } from "../components/shell/PublicShell";
import { DashboardShell } from "../components/shell/DashboardShell";
import { useAuthStore } from "../store/authStore";
import { HomePage, FeaturesPage, ContactPage } from "../pages/PublicPages";
import { AdminAccessPage, FacultyAccessPage, PasswordRecoveryPage, StudentAccessPage } from "../pages/AuthPages";
import {
  AdminDashboardPage,
  FacultyDashboardPage,
  StudentDashboardPage,
} from "../pages/DashboardPages";
import { OperationsPage, TimetableWorkspacePage } from "../pages/OperationsAndTimetablePages";
import { AttendanceWorkspacePage } from "../pages/AttendancePages";
import {
  ContactInboxPage,
  FeedbackWorkspacePage,
  IssuesWorkspacePage,
  NotificationsPage,
  ProfilePage,
} from "../pages/IssueFeedbackProfilePages";

function RoleGuard({ roles, children }) {
  const { user, initialized, bootstrapSession } = useAuthStore();

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/student/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/student/login" element={<StudentAccessPage mode="login" />} />
        <Route path="/student/register" element={<StudentAccessPage mode="register" />} />
        <Route path="/faculty/login" element={<FacultyAccessPage mode="login" />} />
        <Route path="/faculty/register" element={<FacultyAccessPage mode="register" />} />
        <Route path="/admin/login" element={<AdminAccessPage />} />
        <Route path="/recover-account" element={<PasswordRecoveryPage />} />
        <Route path="/reset-password" element={<PasswordRecoveryPage />} />
      </Route>

      <Route
        element={
          <RoleGuard roles={["admin", "faculty", "student"]}>
            <DashboardShell />
          </RoleGuard>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/admin/dashboard" element={<RoleGuard roles={["admin"]}><AdminDashboardPage /></RoleGuard>} />
        <Route path="/admin/operations" element={<RoleGuard roles={["admin"]}><OperationsPage /></RoleGuard>} />
        <Route path="/admin/timetable" element={<RoleGuard roles={["admin"]}><TimetableWorkspacePage role="admin" /></RoleGuard>} />
        <Route path="/admin/attendance" element={<RoleGuard roles={["admin"]}><AttendanceWorkspacePage role="admin" /></RoleGuard>} />
        <Route path="/admin/issues" element={<RoleGuard roles={["admin"]}><IssuesWorkspacePage role="admin" /></RoleGuard>} />
        <Route path="/admin/feedback" element={<RoleGuard roles={["admin"]}><FeedbackWorkspacePage role="admin" /></RoleGuard>} />
        <Route path="/admin/contacts" element={<RoleGuard roles={["admin"]}><ContactInboxPage /></RoleGuard>} />
        <Route path="/admin/notifications" element={<RoleGuard roles={["admin"]}><NotificationsPage /></RoleGuard>} />

        <Route path="/faculty/dashboard" element={<RoleGuard roles={["faculty"]}><FacultyDashboardPage /></RoleGuard>} />
        <Route path="/faculty/timetable" element={<RoleGuard roles={["faculty"]}><TimetableWorkspacePage role="faculty" /></RoleGuard>} />
        <Route path="/faculty/attendance" element={<RoleGuard roles={["faculty"]}><AttendanceWorkspacePage role="faculty" /></RoleGuard>} />
        <Route path="/faculty/feedback" element={<RoleGuard roles={["faculty"]}><FeedbackWorkspacePage role="faculty" /></RoleGuard>} />
        <Route path="/faculty/notifications" element={<RoleGuard roles={["faculty"]}><NotificationsPage /></RoleGuard>} />

        <Route path="/student/dashboard" element={<RoleGuard roles={["student"]}><StudentDashboardPage /></RoleGuard>} />
        <Route path="/student/timetable" element={<RoleGuard roles={["student"]}><TimetableWorkspacePage role="student" /></RoleGuard>} />
        <Route path="/student/attendance" element={<RoleGuard roles={["student"]}><AttendanceWorkspacePage role="student" /></RoleGuard>} />
        <Route path="/student/issues" element={<RoleGuard roles={["student"]}><IssuesWorkspacePage role="student" /></RoleGuard>} />
        <Route path="/student/feedback" element={<RoleGuard roles={["student"]}><FeedbackWorkspacePage role="student" /></RoleGuard>} />
        <Route path="/student/notifications" element={<RoleGuard roles={["student"]}><NotificationsPage /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
