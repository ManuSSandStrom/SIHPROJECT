import { motion } from "framer-motion";
import {
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  LockKeyhole,
  MessageCircleWarning,
  MessageSquareQuote,
  PanelsTopLeft,
  Phone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, unwrap } from "../api/client";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { MetricCard } from "../components/common/MetricCard";
import { FormField } from "../components/forms/FormField";
import { useAuthStore } from "../store/authStore";

const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  collegeId: z.string().optional(),
  category: z.string().min(2),
  message: z.string().min(10),
});

const heroMetrics = [
  {
    title: "AI Weekly Scheduler",
    value: "Mon-Sat",
    hint: "Optional Sunday support with conflict-aware planning",
    icon: CalendarClock,
  },
  {
    title: "Attendance Workflow",
    value: "Role-based",
    hint: "Faculty marking, admin overrides, student analytics",
    icon: ClipboardCheck,
  },
  {
    title: "Issue Management",
    value: "Secure",
    hint: "Confidential complaint handling with replies and audit logs",
    icon: MessageCircleWarning,
  },
  {
    title: "Feedback Engine",
    value: "Structured",
    hint: "Lecturer cycle analytics with one-submission safeguards",
    icon: MessageSquareQuote,
  },
];

const MotionDiv = motion.div;

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#e8f1ff_48%,#c9ddff_100%)] p-8 shadow-[0_26px_80px_rgba(37,99,235,0.16)] lg:p-10"
        >
          <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-sky-300/30 blur-3xl" />
          <p className="inline-flex rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            Smart Classroom Management System
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 lg:text-6xl">
            One production-ready campus platform for academics, attendance, feedback, issues, and weekly scheduling.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 lg:text-base">
            Built for real college operations with hidden admin access, pending faculty approval, timetable-driven attendance, structured lecturer reviews, and secure student issue tracking under one professional interface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_100%)] px-6 py-3 text-sm font-semibold text-white no-underline shadow-[0_12px_28px_rgba(29,78,216,0.24)]" to="/student/login">
              Student Sign In
            </Link>
            <Link className="rounded-2xl border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-800 no-underline" to="/features">
              Explore Features
            </Link>
          </div>
        </MotionDiv>
        <Card className="border-sky-100 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_54%,#dbeafe_100%)] shadow-[0_24px_70px_rgba(37,99,235,0.12)]">
          <CardBody className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Platform Modules
            </p>
            <div className="mt-6 space-y-4">
              {[
                { icon: PanelsTopLeft, title: "ERP-style dashboards", text: "Distinct admin, faculty, and student workspaces with shared design." },
                { icon: CalendarClock, title: "Constraint-based scheduling", text: "Faculty, room, section, and lab conflicts are checked before publish." },
                { icon: ClipboardCheck, title: "Attendance intelligence", text: "Daily sessions, overrides, shortage detection, and analytics are unified." },
                { icon: BookOpenCheck, title: "Academic control", text: "Departments, programs, sections, subjects, rooms, and assignments are centrally managed." },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-sky-100 bg-white/80 p-4 shadow-[0_12px_28px_rgba(37,99,235,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heroMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>
    </div>
  );
}

export function FeaturesPage() {
  const featureCards = [
    {
      title: "AI Timetable Scheduler",
      text: "Weekly generation for Monday to Saturday with optional Sunday, room logic, faculty workload checks, lab allocation, publishing, and day-level regeneration.",
    },
    {
      title: "Attendance Management",
      text: "Session-based attendance, faculty marking, admin overrides, shortage thresholds, monthly reports, absentee tracking, and student-level dashboards.",
    },
    {
      title: "Issue and Complaint Desk",
      text: "Private student complaint submission, admin replies, status pipeline control, confidential visibility, and audit-ready action history.",
    },
    {
      title: "Lecturer Feedback",
      text: "Feedback cycles, structured question templates, one-submission rules, lecturer analytics, and export-ready summaries.",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform Scope"
        title="A unified academic operations stack for modern campuses"
        description="The system is designed like a deployable institutional platform, not a classroom demo. Each module shares the same white-blue visual system, role permissions, and operational data model."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {featureCards.map((card) => (
          <Card key={card.title}>
            <CardBody className="p-7">
              <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.text}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [showAdminLock, setShowAdminLock] = useState(false);
  const [adminError, setAdminError] = useState("");
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      collegeId: "",
      category: "general_support",
      message: "",
    },
  });
  const adminForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    await unwrap(api.post("/contact", values));
    form.reset();
  }

  async function unlockAdmin(values) {
    setAdminError("");

    try {
      const session = await unwrap(api.post("/auth/login", values));
      setSession(session);
      navigate("/admin/dashboard");
    } catch (error) {
      setAdminError(error?.response?.data?.message || "Unable to unlock the admin workspace.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Help Desk"
          title="Contact support without exposing admin access in the main navigation"
          description="Students, faculty, and visitors can send support requests here. Admin and faculty access stay hidden behind secure entry points on this page."
        />
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-start gap-4 rounded-[24px] border border-sky-100 bg-sky-50/70 p-4">
              <div className="rounded-2xl bg-white p-3 text-sky-700">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">Campus Support</h3>
                <p className="mt-1 text-sm text-slate-600">Use this inbox for timetable, attendance, academic, or portal access help.</p>
              </div>
            </div>
            <div className="grid gap-4">
              <Link to="/faculty/login" className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 no-underline">
                <LockKeyhole size={16} />
                Hidden Faculty Access
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Send a message"
          description="Every submission is routed to the admin contact inbox for follow-up."
        />
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField label="Full Name" error={form.formState.errors.name?.message} {...form.register("name")} />
            <FormField label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
            <FormField label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="College ID" error={form.formState.errors.collegeId?.message} {...form.register("collegeId")} />
            <div className="md:col-span-2">
              <FormField
                label="Category"
                as="select"
                options={[
                  { value: "general_support", label: "General Support" },
                  { value: "technical_support", label: "Technical Support" },
                  { value: "access_request", label: "Access Request" },
                  { value: "academic_help", label: "Academic Help" },
                ]}
                error={form.formState.errors.category?.message}
                {...form.register("category")}
              />
            </div>
            <div className="md:col-span-2">
              <FormField label="Message" as="textarea" error={form.formState.errors.message?.message} {...form.register("message")} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_100%)] px-6 py-3 text-sm font-semibold text-white">
                Send to Admin Inbox
              </button>
            </div>
            <div className="md:col-span-2 flex items-center justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800"
                onClick={() => setShowAdminLock((value) => !value)}
              >
                <LockKeyhole size={14} />
                {showAdminLock ? "Hide Admin Lock" : "Admin Lock"}
              </button>
            </div>
            {showAdminLock ? (
              <div className="md:col-span-2 rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Hidden administrator access</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Enter admin credentials here to move directly into the admin workspace.
                    </p>
                  </div>
                  <LockKeyhole size={18} className="text-sky-700" />
                </div>
                {adminError ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{adminError}</div> : null}
                <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={adminForm.handleSubmit(unlockAdmin)}>
                  <FormField label="Admin Email" type="email" {...adminForm.register("email")} />
                  <FormField label="Password" type="password" {...adminForm.register("password")} />
                  <div className="md:col-span-2 flex flex-wrap items-center gap-4">
                    <button type="submit" className="rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(29,78,216,0.24)]">
                      {adminForm.formState.isSubmitting ? "Unlocking..." : "Enter Admin Workspace"}
                    </button>
                    <Link to="/recover-account" className="text-sm font-semibold text-slate-600 no-underline">
                      Forgot password?
                    </Link>
                  </div>
                </form>
              </div>
            ) : null}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
