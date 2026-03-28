import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/common/PageHeader";
import { api, unwrap } from "../api/client";
import { useAuthStore } from "../store/authStore";

const baseAuth = {
  email: z.string().email(),
  password: z.string().min(8),
};

const studentRegisterSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  collegeId: z.string().min(3),
  rollNumber: z.string().optional(),
  departmentId: z.string().min(24),
  programId: z.string().min(24),
  semesterNumber: z.coerce.number().min(1).max(12),
  sectionId: z.string().min(24),
  batchYear: z.coerce.number().min(2000).max(2100),
});

const facultyRegisterSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  staffId: z.string().min(3),
  qualification: z.string().min(2),
  departmentId: z.string().min(24),
  specialization: z.string().min(3),
});

const adminLoginSchema = z.object(baseAuth);
const simpleLoginSchema = z.object(baseAuth);

const sampleAcademicIds = {
  departmentId: "000000000000000000000001",
  programId: "000000000000000000000002",
  sectionId: "000000000000000000000003",
};

function AuthIntro({ title, text, helper }) {
  return (
    <Card className="bg-slate-950 text-white">
      <CardBody className="space-y-5 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Secure Access</p>
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="text-sm leading-7 text-sky-100/80">{text}</p>
        {helper ? <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-sky-100">{helper}</div> : null}
      </CardBody>
    </Card>
  );
}

export function StudentAccessPage({ mode = "login" }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const isRegister = mode === "register";
  const schema = isRegister ? studentRegisterSchema : simpleLoginSchema;
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isRegister
      ? {
          fullName: "",
          email: "",
          password: "",
          phone: "",
          collegeId: "",
          rollNumber: "",
          semesterNumber: 5,
          batchYear: new Date().getFullYear(),
          ...sampleAcademicIds,
        }
      : { email: "", password: "" },
  });

  async function onSubmit(values) {
    if (isRegister) {
      await unwrap(api.post("/auth/student/register", values));
      navigate("/student/login");
      return;
    }

    const session = await unwrap(api.post("/auth/login", values));
    setSession(session);
    navigate("/student/dashboard");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <AuthIntro
        title="Student Workspace Access"
        text="Students sign in with their institutional account to view timetables, check attendance, raise secure issues, and complete lecturer feedback."
        helper="For local setup, seed data uses real Mongo IDs. The registration form defaults to placeholder IDs until the admin creates actual departments, programs, and sections from the operations hub."
      />
      <Card>
        <CardHeader
          title={isRegister ? "Create Student Account" : "Student Login"}
          description={isRegister ? "Use academic mappings created by admin." : "Sign in to your student portal."}
        />
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            {isRegister ? <FormField label="Full Name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} /> : null}
            <FormField label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="Password" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
            {isRegister ? (
              <>
                <FormField label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
                <FormField label="College ID" error={form.formState.errors.collegeId?.message} {...form.register("collegeId")} />
                <FormField label="Roll Number" error={form.formState.errors.rollNumber?.message} {...form.register("rollNumber")} />
                <FormField label="Department ID" error={form.formState.errors.departmentId?.message} {...form.register("departmentId")} />
                <FormField label="Program ID" error={form.formState.errors.programId?.message} {...form.register("programId")} />
                <FormField label="Section ID" error={form.formState.errors.sectionId?.message} {...form.register("sectionId")} />
                <FormField label="Semester Number" type="number" error={form.formState.errors.semesterNumber?.message} {...form.register("semesterNumber")} />
                <FormField label="Batch Year" type="number" error={form.formState.errors.batchYear?.message} {...form.register("batchYear")} />
              </>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                {isRegister ? "Create Student Account" : "Enter Student Portal"}
              </button>
              <Link to={isRegister ? "/student/login" : "/student/register"} className="text-sm font-semibold text-sky-700 no-underline">
                {isRegister ? "Already have an account?" : "Need a student account?"}
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function FacultyAccessPage({ mode = "login" }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const isRegister = mode === "register";
  const schema = isRegister ? facultyRegisterSchema : simpleLoginSchema;
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isRegister
      ? {
          fullName: "",
          email: "",
          password: "",
          phone: "",
          staffId: "",
          qualification: "",
          departmentId: sampleAcademicIds.departmentId,
          specialization: "Algorithms, Databases",
        }
      : { email: "", password: "" },
  });

  async function onSubmit(values) {
    if (isRegister) {
      await unwrap(
        api.post("/auth/faculty/register", {
          ...values,
          specialization: values.specialization.split(",").map((item) => item.trim()).filter(Boolean),
          assignedSectionIds: [],
        }),
      );
      navigate("/faculty/login");
      return;
    }

    const session = await unwrap(api.post("/auth/login", values));
    setSession(session);
    navigate("/faculty/dashboard");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <AuthIntro
        title="Faculty Approval Workflow"
        text="Faculty accounts remain pending until the admin approves them from the secure operations workspace."
        helper="Use the hidden staff access only. This route is intentionally separate from the public navigation."
      />
      <Card>
        <CardHeader
          title={isRegister ? "Request Faculty Access" : "Faculty Login"}
          description={isRegister ? "Submit your professional profile for approval." : "Approved faculty can access timetable and attendance workflows."}
        />
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            {isRegister ? <FormField label="Full Name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} /> : null}
            <FormField label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="Password" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
            {isRegister ? (
              <>
                <FormField label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
                <FormField label="Staff ID" error={form.formState.errors.staffId?.message} {...form.register("staffId")} />
                <FormField label="Qualification" error={form.formState.errors.qualification?.message} {...form.register("qualification")} />
                <FormField label="Department ID" error={form.formState.errors.departmentId?.message} {...form.register("departmentId")} />
                <div className="md:col-span-2">
                  <FormField label="Specialization" error={form.formState.errors.specialization?.message} {...form.register("specialization")} />
                </div>
              </>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                {isRegister ? "Submit Approval Request" : "Enter Faculty Workspace"}
              </button>
              <Link to={isRegister ? "/faculty/login" : "/faculty/register"} className="text-sm font-semibold text-sky-700 no-underline">
                {isRegister ? "Already requested access?" : "Need faculty approval?"}
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function AdminAccessPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    const session = await unwrap(api.post("/auth/login", values));
    setSession(session);
    navigate("/admin/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Hidden Admin Lock"
        title="Admin-only portal access"
        description="This route is intentionally not placed in the public navigation. Use it to enter the academic operations workspace."
      />
      <Card>
        <CardHeader title="Admin Login" description="Use administrator credentials configured through environment variables and seed data." />
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField label="Admin Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="Password" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
            <div className="md:col-span-2">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                Unlock Admin Workspace
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
