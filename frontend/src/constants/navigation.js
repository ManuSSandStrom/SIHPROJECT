import {
  BookOpenCheck,
  Building2,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessageCircleWarning,
  MessageSquareQuote,
  Send,
  Shield,
} from "lucide-react";

export const publicNavigation = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Contact / Help", to: "/contact" },
  { label: "Student Access", to: "/student/login" },
];

export const adminNavigation = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Academic Setup", to: "/admin/operations", icon: Building2 },
  { label: "Timetable Flow", to: "/admin/timetable", icon: CalendarClock },
  { label: "Attendance", to: "/admin/attendance", icon: ClipboardCheck },
  { label: "Issues", to: "/admin/issues", icon: MessageCircleWarning },
  { label: "Feedback", to: "/admin/feedback", icon: MessageSquareQuote },
  { label: "Contact Inbox", to: "/admin/contacts", icon: Mail },
  { label: "Notifications", to: "/admin/notifications", icon: Send },
  { label: "Profile", to: "/profile", icon: Shield },
];

export const facultyNavigation = [
  { label: "Dashboard", to: "/faculty/dashboard", icon: LayoutDashboard },
  { label: "My Timetable", to: "/faculty/timetable", icon: CalendarClock },
  { label: "Take Attendance", to: "/faculty/attendance", icon: ClipboardCheck },
  { label: "Notifications", to: "/faculty/notifications", icon: Send },
  { label: "Profile", to: "/profile", icon: GraduationCap },
];

export const studentNavigation = [
  { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Timetable", to: "/student/timetable", icon: CalendarClock },
  { label: "My Attendance", to: "/student/attendance", icon: ClipboardCheck },
  { label: "Raise Issue", to: "/student/issues", icon: MessageCircleWarning },
  { label: "Lecturer Feedback", to: "/student/feedback", icon: MessageSquareQuote },
  { label: "Notifications", to: "/student/notifications", icon: Send },
  { label: "Profile", to: "/profile", icon: BookOpenCheck },
];
