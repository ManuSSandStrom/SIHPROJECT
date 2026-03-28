import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/common/PageHeader";
import { api, unwrap } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useApiState } from "../hooks/useApiState";

const baseAuth = {
  email: z.string().email(),
  password: z.string().min(8),
};

const objectIdField = (label) =>
  z.string().regex(/^[a-f\d]{24}$/i, `Please select a ${label.toLowerCase()}.`);

const studentRegisterSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  collegeId: z.string().min(3),
  rollNumber: z.string().optional(),
  departmentId: objectIdField("Department"),
  programId: objectIdField("Program"),
  semesterNumber: z.coerce.number().min(1).max(12),
  sectionId: objectIdField("Section"),
  batchYear: z.coerce.number().min(2000).max(2100),
});

const facultyRegisterSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  staffId: z.string().min(3),
  qualification: z.string().min(2),
  departmentId: objectIdField("Department"),
  specialization: z.string().min(3),
});

const adminLoginSchema = z.object(baseAuth);
const simpleLoginSchema = z.object(baseAuth);
const EMPTY_ACADEMIC_OPTIONS = { departments: [], programs: [], sections: [] };
const passwordField = z.string().min(8, "Password must be at least 8 characters.");
const otpField = z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP.");
const resetWithTokenSchema = z.object({
  password: passwordField,
  confirmPassword: z.string().min(8),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});
const resetWithOtpSchema = z.object({
  email: z.string().email(),
  otp: otpField,
  password: passwordField,
  confirmPassword: z.string().min(8),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function readApiError(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function AuthIntro({ title, text, helper }) {
  return (
    <Card className="border-slate-900/70 bg-[linear-gradient(180deg,#0f172a_0%,#162447_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
      <CardBody className="space-y-5 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">Secure Access</p>
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="text-sm leading-7 text-slate-200">{text}</p>
        {helper ? <div className="rounded-[24px] border border-sky-400/20 bg-slate-900/45 p-4 text-sm leading-7 text-slate-100">{helper}</div> : null}
      </CardBody>
    </Card>
  );
}

export function StudentAccessPage({ mode = "login" }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [authError, setAuthError] = useState("");
  const isRegister = mode === "register";
  const academicOptions = useApiState(
    () => (isRegister ? unwrap(api.get("/auth/academic-options")) : Promise.resolve(EMPTY_ACADEMIC_OPTIONS)),
    `student-registration-academic-options-${isRegister}`,
  );
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
          departmentId: "",
          programId: "",
          semesterNumber: "",
          sectionId: "",
          batchYear: new Date().getFullYear(),
        }
      : { email: "", password: "" },
  });
  const selectedDepartmentId = useWatch({ control: form.control, name: "departmentId" });
  const selectedProgramId = useWatch({ control: form.control, name: "programId" });
  const selectedSemesterNumber = Number(useWatch({ control: form.control, name: "semesterNumber" }) || 0);
  const academicData = academicOptions.data || EMPTY_ACADEMIC_OPTIONS;
  const { departments, programs, sections } = academicData;

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "Select department", disabled: true },
      ...departments.map((department) => ({ value: department._id, label: department.label })),
    ],
    [departments],
  );

  const filteredPrograms = useMemo(
    () => programs.filter((program) => !selectedDepartmentId || program.departmentId === selectedDepartmentId),
    [programs, selectedDepartmentId],
  );

  const programOptions = useMemo(
    () => [
      { value: "", label: filteredPrograms.length ? "Select program" : "No programs available", disabled: true },
      ...filteredPrograms.map((program) => ({ value: program._id, label: program.label })),
    ],
    [filteredPrograms],
  );

  const semesterOptions = useMemo(() => {
    const semesterNumbers = [...new Set(
      sections
        .filter((section) => !selectedDepartmentId || section.departmentId === selectedDepartmentId)
        .filter((section) => !selectedProgramId || section.programId === selectedProgramId)
        .map((section) => section.semesterNumber),
    )].sort((left, right) => left - right);

    return [
      { value: "", label: semesterNumbers.length ? "Select semester" : "No semesters available", disabled: true },
      ...semesterNumbers.map((semesterNumber) => ({
        value: String(semesterNumber),
        label: `Semester ${semesterNumber}`,
      })),
    ];
  }, [sections, selectedDepartmentId, selectedProgramId]);

  const filteredSections = useMemo(
    () =>
      sections
        .filter((section) => !selectedDepartmentId || section.departmentId === selectedDepartmentId)
        .filter((section) => !selectedProgramId || section.programId === selectedProgramId)
        .filter((section) => !selectedSemesterNumber || section.semesterNumber === selectedSemesterNumber),
    [sections, selectedDepartmentId, selectedProgramId, selectedSemesterNumber],
  );

  const sectionOptions = useMemo(
    () => [
      { value: "", label: filteredSections.length ? "Select section" : "No sections available", disabled: true },
      ...filteredSections.map((section) => ({ value: section._id, label: section.label })),
    ],
    [filteredSections],
  );

  useEffect(() => {
    if (!isRegister) return;
    const currentProgramId = form.getValues("programId");
    if (currentProgramId && !filteredPrograms.some((program) => program._id === currentProgramId)) {
      form.setValue("programId", "");
    }
  }, [filteredPrograms, form, isRegister, selectedDepartmentId]);

  useEffect(() => {
    if (!isRegister) return;
    const availableSemesterNumbers = semesterOptions
      .filter((option) => option.value)
      .map((option) => Number(option.value));
    const currentSemester = Number(form.getValues("semesterNumber") || 0);
    if (currentSemester && !availableSemesterNumbers.includes(currentSemester)) {
      form.setValue("semesterNumber", "");
    }
  }, [form, isRegister, semesterOptions, selectedProgramId]);

  useEffect(() => {
    if (!isRegister) return;
    const currentSectionId = form.getValues("sectionId");
    if (currentSectionId && !filteredSections.some((section) => section._id === currentSectionId)) {
      form.setValue("sectionId", "");
    }
  }, [filteredSections, form, isRegister, selectedDepartmentId, selectedProgramId, selectedSemesterNumber]);

  async function onSubmit(values) {
    setAuthError("");

    try {
    if (isRegister) {
      await unwrap(api.post("/auth/student/register", values));
      navigate("/student/login");
      return;
    }

    const session = await unwrap(api.post("/auth/login", values));
    setSession(session);
    navigate("/student/dashboard");
    } catch (error) {
      setAuthError(readApiError(error, isRegister ? "Unable to create the student account." : "Unable to sign in right now."));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <AuthIntro
        title="Student Workspace Access"
        text="Students sign in with their institutional account to view timetables, check attendance, raise secure issues, and complete lecturer feedback."
        helper="Choose your department, program, semester, and section from the academic structure configured by the admin. Registration is now aligned to real campus onboarding rather than internal database IDs."
      />
      <Card>
        <CardHeader
          title={isRegister ? "Create Student Account" : "Student Login"}
          description={isRegister ? "Use academic mappings created by admin." : "Sign in to your student portal."}
        />
        <CardBody>
          {authError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</div> : null}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            {isRegister ? <FormField label="Full Name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} /> : null}
            <FormField label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="Password" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
            {isRegister ? (
              <>
                <FormField label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
                <FormField label="College ID" error={form.formState.errors.collegeId?.message} {...form.register("collegeId")} />
                <FormField label="Roll Number" error={form.formState.errors.rollNumber?.message} {...form.register("rollNumber")} />
                <FormField
                  label="Department"
                  as="select"
                  options={departmentOptions}
                  error={form.formState.errors.departmentId?.message}
                  disabled={academicOptions.loading || !departmentOptions.length}
                  {...form.register("departmentId")}
                />
                <FormField
                  label="Program"
                  as="select"
                  options={programOptions}
                  error={form.formState.errors.programId?.message}
                  disabled={academicOptions.loading || !filteredPrograms.length}
                  {...form.register("programId")}
                />
                <FormField
                  label="Section"
                  as="select"
                  options={sectionOptions}
                  error={form.formState.errors.sectionId?.message}
                  disabled={academicOptions.loading || !filteredSections.length}
                  {...form.register("sectionId")}
                />
                <FormField
                  label="Semester"
                  as="select"
                  options={semesterOptions}
                  error={form.formState.errors.semesterNumber?.message}
                  disabled={academicOptions.loading || semesterOptions.length <= 1}
                  {...form.register("semesterNumber")}
                />
                <FormField label="Batch Year" type="number" error={form.formState.errors.batchYear?.message} {...form.register("batchYear")} />
                {academicOptions.loading ? <p className="md:col-span-2 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-600">Loading department, program, and section options...</p> : null}
                {!academicOptions.loading && !departments.length ? <p className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Academic options are not available yet. Ask the admin to create departments, programs, and sections first.</p> : null}
              </>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                {form.formState.isSubmitting
                  ? (isRegister ? "Creating Account..." : "Signing In...")
                  : (isRegister ? "Create Student Account" : "Enter Student Portal")}
              </button>
              <Link to={isRegister ? "/student/login" : "/student/register"} className="text-sm font-semibold text-sky-700 no-underline">
                {isRegister ? "Already have an account?" : "Need a student account?"}
              </Link>
              {!isRegister ? (
                <Link to="/recover-account" className="text-sm font-semibold text-slate-600 no-underline">
                  Forgot password?
                </Link>
              ) : null}
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
  const [authError, setAuthError] = useState("");
  const isRegister = mode === "register";
  const academicOptions = useApiState(
    () => (isRegister ? unwrap(api.get("/auth/academic-options")) : Promise.resolve(EMPTY_ACADEMIC_OPTIONS)),
    `faculty-registration-academic-options-${isRegister}`,
  );
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
          departmentId: "",
          specialization: "Algorithms, Databases",
        }
      : { email: "", password: "" },
  });
  const facultyDepartmentOptions = useMemo(
    () => [
      { value: "", label: "Select department", disabled: true },
      ...(academicOptions.data?.departments || EMPTY_ACADEMIC_OPTIONS.departments).map((department) => ({
        value: department._id,
        label: department.label,
      })),
    ],
    [academicOptions.data?.departments],
  );

  async function onSubmit(values) {
    setAuthError("");

    try {
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
    } catch (error) {
      setAuthError(readApiError(error, isRegister ? "Unable to submit the faculty access request." : "Unable to sign in right now."));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <AuthIntro
        title="Faculty Approval Workflow"
        text="Faculty accounts remain pending until the admin approves them from the secure operations workspace."
        helper="Use the hidden staff access only. Faculty can submit professional details and select their department from the live academic structure configured by admin."
      />
      <Card>
        <CardHeader
          title={isRegister ? "Request Faculty Access" : "Faculty Login"}
          description={isRegister ? "Submit your professional profile for approval." : "Approved faculty can access timetable and attendance workflows."}
        />
        <CardBody>
          {authError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</div> : null}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            {isRegister ? <FormField label="Full Name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} /> : null}
            <FormField label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="Password" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
            {isRegister ? (
              <>
                <FormField label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
                <FormField label="Staff ID" error={form.formState.errors.staffId?.message} {...form.register("staffId")} />
                <FormField label="Qualification" error={form.formState.errors.qualification?.message} {...form.register("qualification")} />
                <FormField
                  label="Department"
                  as="select"
                  options={facultyDepartmentOptions}
                  error={form.formState.errors.departmentId?.message}
                  disabled={academicOptions.loading || facultyDepartmentOptions.length <= 1}
                  {...form.register("departmentId")}
                />
                <div className="md:col-span-2">
                  <FormField label="Specialization" error={form.formState.errors.specialization?.message} {...form.register("specialization")} />
                </div>
                {academicOptions.loading ? <p className="md:col-span-2 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-600">Loading department options...</p> : null}
              </>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                {form.formState.isSubmitting
                  ? (isRegister ? "Submitting Request..." : "Signing In...")
                  : (isRegister ? "Submit Approval Request" : "Enter Faculty Workspace")}
              </button>
              <Link to={isRegister ? "/faculty/login" : "/faculty/register"} className="text-sm font-semibold text-sky-700 no-underline">
                {isRegister ? "Already requested access?" : "Need faculty approval?"}
              </Link>
              {!isRegister ? (
                <Link to="/recover-account" className="text-sm font-semibold text-slate-600 no-underline">
                  Forgot password?
                </Link>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [requestMeta, setRequestMeta] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const requestForm = useForm({
    resolver: zodResolver(z.object({ email: z.string().email() })),
    defaultValues: { email: "" },
  });
  const otpForm = useForm({
    resolver: zodResolver(resetWithOtpSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });
  const linkResetForm = useForm({
    resolver: zodResolver(resetWithTokenSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function requestOtp(values) {
    setErrorMessage("");
    setFeedbackMessage("");

    try {
      const result = await unwrap(api.post("/auth/forgot-password", values));
      setRequestMeta({
        email: values.email,
        requestId: result.requestId,
        expiresInMinutes: result.expiresInMinutes || 10,
      });
      otpForm.reset({
        email: values.email,
        otp: "",
        password: "",
        confirmPassword: "",
      });
      setFeedbackMessage(`If the account exists, an OTP has been sent and will stay active for ${result.expiresInMinutes || 10} minutes.`);
    } catch (error) {
      setErrorMessage(readApiError(error, "Unable to start password recovery right now."));
    }
  }

  async function submitOtpReset(values) {
    if (!requestMeta?.requestId) {
      setErrorMessage("Request a fresh OTP before resetting the password.");
      return;
    }

    setErrorMessage("");
    setFeedbackMessage("");

    try {
      await unwrap(api.post("/auth/reset-password/otp", {
        email: values.email,
        requestId: requestMeta.requestId,
        otp: values.otp,
        password: values.password,
      }));
      setFeedbackMessage("Password updated successfully. You can sign in now.");
      navigate("/student/login");
    } catch (error) {
      setErrorMessage(readApiError(error, "OTP verification failed."));
    }
  }

  async function submitLinkReset(values) {
    setErrorMessage("");
    setFeedbackMessage("");

    try {
      await unwrap(api.post("/auth/reset-password", {
        token,
        password: values.password,
      }));
      setFeedbackMessage("Password updated successfully. You can sign in now.");
      navigate("/student/login");
    } catch (error) {
      setErrorMessage(readApiError(error, "Reset link is invalid or expired."));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <AuthIntro
        title="Fast Password Recovery"
        text="Use the OTP-based recovery flow for faster access, or continue with a secure reset link if you opened one from email."
        helper="Recovery responses return quickly now. OTP generation is immediate, while email delivery is handled in the background so the interface does not feel blocked."
      />
      <Card>
        <CardHeader
          title={token ? "Set a New Password" : "Forgot Password"}
          description={token ? "This secure link lets you reset your password directly." : "Request a one-time password, then set a new password without waiting on a slow page refresh."}
        />
        <CardBody className="space-y-5">
          {feedbackMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedbackMessage}</div> : null}
          {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}

          {token ? (
            <form className="grid gap-4" onSubmit={linkResetForm.handleSubmit(submitLinkReset)}>
              <FormField label="New Password" type="password" error={linkResetForm.formState.errors.password?.message} {...linkResetForm.register("password")} />
              <FormField label="Confirm New Password" type="password" error={linkResetForm.formState.errors.confirmPassword?.message} {...linkResetForm.register("confirmPassword")} />
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                  {linkResetForm.formState.isSubmitting ? "Updating Password..." : "Update Password"}
                </button>
                <Link to="/recover-account" className="text-sm font-semibold text-sky-700 no-underline">
                  Use OTP instead
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={requestForm.handleSubmit(requestOtp)}>
                <FormField label="Account Email" type="email" error={requestForm.formState.errors.email?.message} {...requestForm.register("email")} />
                <div className="md:pt-[30px]">
                  <button type="submit" className="w-full rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                    {requestForm.formState.isSubmitting ? "Sending OTP..." : requestMeta ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </form>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={otpForm.handleSubmit(submitOtpReset)}>
                <FormField label="Email" type="email" error={otpForm.formState.errors.email?.message} {...otpForm.register("email")} />
                <FormField label="OTP Code" error={otpForm.formState.errors.otp?.message} {...otpForm.register("otp")} />
                <FormField label="New Password" type="password" error={otpForm.formState.errors.password?.message} {...otpForm.register("password")} />
                <FormField label="Confirm New Password" type="password" error={otpForm.formState.errors.confirmPassword?.message} {...otpForm.register("confirmPassword")} />
                <div className="md:col-span-2 flex flex-wrap items-center gap-4">
                  <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                    {otpForm.formState.isSubmitting ? "Verifying OTP..." : "Verify OTP and Reset"}
                  </button>
                  <Link to="/student/login" className="text-sm font-semibold text-sky-700 no-underline">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export function AdminAccessPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [authError, setAuthError] = useState("");
  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setAuthError("");

    try {
      const session = await unwrap(api.post("/auth/login", values));
      setSession(session);
      navigate("/admin/dashboard");
    } catch (error) {
      setAuthError(readApiError(error, "Unable to unlock the admin workspace."));
    }
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
          {authError ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</div> : null}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField label="Admin Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
            <FormField label="Password" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                {form.formState.isSubmitting ? "Unlocking..." : "Unlock Admin Workspace"}
              </button>
              <Link to="/recover-account" className="text-sm font-semibold text-slate-600 no-underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
