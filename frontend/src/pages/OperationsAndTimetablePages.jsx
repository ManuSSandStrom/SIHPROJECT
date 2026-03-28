import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  Download,
  GraduationCap,
  Plus,
  Save,
  School,
  UserRoundCheck,
  Users,
  Warehouse,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { MetricCard } from "../components/common/MetricCard";
import { FormField } from "../components/forms/FormField";
import { DataTable } from "../components/data/DataTable";
import { api, unwrap } from "../api/client";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { useApiState } from "../hooks/useApiState";

const EMPTY_LIST = [];

function withPlaceholder(options, label) {
  return [{ value: "", label, disabled: true }, ...options];
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadReport(type, format, params, fileName) {
  const response = await api.get(`/reports/${type}/${format}`, {
    params,
    responseType: "blob",
  });
  downloadBlob(response.data, fileName);
}

function WorkflowCard({ step, title, description }) {
  return (
    <Card className="h-full">
      <CardBody className="space-y-3">
        <Badge tone="info">{step}</Badge>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </CardBody>
    </Card>
  );
}

function SubmissionBanner({ feedback }) {
  if (!feedback?.message) return null;
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        feedback.tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {feedback.message}
    </div>
  );
}

function WeeklyGrid({ timetable }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[960px] grid-cols-7 gap-3">
        {days.map((day) => (
          <div key={day} className="rounded-[24px] border border-sky-100 bg-sky-50/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-950">{day}</h4>
              {day === "Sunday" ? <Badge tone="warning">Special</Badge> : null}
            </div>
            <div className="space-y-3">
              {(timetable?.entries || [])
                .filter((entry) => entry.day === day)
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((entry) => (
                  <div key={entry._id || `${day}-${entry.periodNumber}`} className="rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(14,116,144,0.06)]">
                    <p className="text-sm font-semibold text-slate-950">{entry.subject?.name || "Subject"}</p>
                    <p className="mt-1 text-xs text-slate-500">P{entry.periodNumber} | {entry.startTime} - {entry.endTime}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.faculty?.user?.fullName || entry.faculty?.staffId || "Faculty"} | {entry.roomLabel || "-"}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const setup = useApiState(() => unwrap(api.get("/admin/setup-options")), `admin-setup-${refreshKey}`);
  const approvals = useApiState(() => unwrap(api.get("/admin/faculty-approvals")), `approvals-${refreshKey}`);

  const departmentForm = useForm({ defaultValues: { name: "", code: "", hodName: "", description: "" } });
  const programForm = useForm({ defaultValues: { name: "", code: "", department: "", degreeLevel: "UG", durationSemesters: 8 } });
  const subjectForm = useForm({ defaultValues: { name: "", code: "", department: "", program: "", semesterNumber: 1, credits: 4, weeklyHours: 3, labHours: 0, type: "theory" } });
  const facultyForm = useForm({ defaultValues: { fullName: "", email: "", password: "", phone: "", staffId: "", qualification: "", department: "", specializationText: "", maxWeeklyLoad: 20 } });
  const studentForm = useForm({ defaultValues: { fullName: "", email: "", password: "", phone: "", collegeId: "", rollNumber: "", department: "", program: "", semesterNumber: 1, sectionName: "", batchYear: new Date().getFullYear(), emergencyContact: "" } });
  const roomForm = useForm({ defaultValues: { roomType: "classrooms", name: "", code: "", building: "", floor: 1, capacity: 60, labType: "Computer Lab", featuresText: "" } });
  const assignmentForm = useForm({ defaultValues: { faculty: "", section: "", subject: "", preferredRoomType: "classroom", weeklyHoursOverride: "" } });

  const departments = setup.data?.departments ?? EMPTY_LIST;
  const programs = setup.data?.programs ?? EMPTY_LIST;
  const sections = setup.data?.sections ?? EMPTY_LIST;
  const subjects = setup.data?.subjects ?? EMPTY_LIST;
  const faculty = setup.data?.faculty ?? EMPTY_LIST;
  const students = setup.data?.students ?? EMPTY_LIST;
  const assignmentSection = assignmentForm.watch("section");

  const departmentOptions = withPlaceholder(
    departments.map((department) => ({ value: department._id, label: `${department.name} (${department.code})` })),
    "Select department",
  );

  const programOptions = (departmentId, placeholder = "Select program") =>
    withPlaceholder(
      programs
        .filter((program) => String(program.department?._id || program.department) === String(departmentId))
        .map((program) => ({ value: program._id, label: `${program.name} (${program.code}) | ${program.degreeLevel}` })),
      placeholder,
    );

  const sectionOptions = withPlaceholder(
    sections.map((section) => ({ value: section._id, label: `${section.program?.name || "Program"} Semester ${section.semesterNumber} - ${section.name}` })),
    "Select section",
  );

  const facultyOptions = withPlaceholder(
    faculty.map((member) => ({ value: member._id, label: `${member.user?.fullName || member.staffId} (${member.staffId})` })),
    "Select faculty",
  );

  const assignmentSubjectOptions = useMemo(() => {
    if (!assignmentSection) return withPlaceholder([], "Select section first");
    const selectedSection = sections.find((section) => section._id === assignmentSection);
    return withPlaceholder(
      subjects
        .filter((subject) => String(subject.program?._id || subject.program) === String(selectedSection?.program?._id || selectedSection?.program) && subject.semesterNumber === selectedSection?.semesterNumber)
        .map((subject) => ({ value: subject._id, label: `${subject.code} | ${subject.name}` })),
      "Select subject",
    );
  }, [assignmentSection, sections, subjects]);

  async function submitResource(resource, values, form, transform = (payload) => payload) {
    try {
      await unwrap(api.post(`/admin/master/${resource}`, transform(values)));
      setFeedback({ tone: "success", message: `${resource} updated successfully.` });
      form.reset();
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFeedback({ tone: "error", message: error.response?.data?.message || "Request failed. Please review the form and try again." });
    }
  }

  async function approve(userId) {
    await unwrap(api.post(`/admin/faculty-approvals/${userId}/approve`));
    setRefreshKey((value) => value + 1);
  }

  const readiness = setup.data?.readiness || {};
  const sectionReadiness = setup.data?.sectionReadiness || [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Academic Setup" title="Prepare one semester before timetable generation" description="Build your semester in a clean sequence: create departments and programs, add courses, onboard faculty, create student rosters, define rooms, then map faculty to section subjects before generating and publishing the weekly timetable." />
      <SubmissionBanner feedback={feedback} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Departments & Programs" value={`${readiness.departments || 0} / ${readiness.programs || 0}`} hint="Academic structure ready for registration and timetable setup." icon={School} />
        <MetricCard title="Courses & Assignments" value={`${readiness.subjects || 0} / ${readiness.assignments || 0}`} hint="Subjects must be mapped to faculty and sections before generation." icon={BookOpen} />
        <MetricCard title="Faculty & Students" value={`${readiness.faculty || 0} / ${readiness.students || 0}`} hint="These records create the timetable teaching pool and section rosters." icon={Users} />
        <MetricCard title="Rooms & Labs" value={readiness.rooms || 0} hint="Classrooms and labs are automatically allocated during scheduling." icon={Warehouse} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <WorkflowCard step="Step 1" title="Set up academics" description="Start with departments, programs, and subjects. These become the source of truth for student registration, section structure, and timetable generation." />
        <WorkflowCard step="Step 2" title="Add people and spaces" description="Create faculty login-ready profiles, add the student roster with section information, and define classrooms and laboratories with capacity and building details." />
        <WorkflowCard step="Step 3" title="Map teaching load" description="Assign each subject to a faculty member and section. Once assignments and rooms exist, the timetable generator can create a draft, and you can publish the final version for the semester." />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Department and Program" description="Use structured dropdown-linked academic data instead of raw IDs." />
          <CardBody className="space-y-6">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={departmentForm.handleSubmit((values) => submitResource("departments", values, departmentForm))}>
              <FormField label="Department Name" {...departmentForm.register("name")} />
              <FormField label="Department Code" {...departmentForm.register("code")} />
              <FormField label="Head of Department" {...departmentForm.register("hodName")} />
              <FormField label="Description" {...departmentForm.register("description")} />
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><Plus size={16} />Add Department</button></div>
            </form>
            <div className="h-px bg-slate-100" />
            <form className="grid gap-4 md:grid-cols-2" onSubmit={programForm.handleSubmit((values) => submitResource("programs", values, programForm, (payload) => ({ ...payload, durationSemesters: Number(payload.durationSemesters) })))}>
              <FormField label="Program Name" {...programForm.register("name")} />
              <FormField label="Program Code" {...programForm.register("code")} />
              <FormField label="Department" as="select" options={departmentOptions} {...programForm.register("department")} />
              <FormField label="Degree Level" as="select" options={[{ value: "UG", label: "UG" }, { value: "PG", label: "PG" }, { value: "BTECH", label: "B.Tech" }, { value: "MCA", label: "MCA" }, { value: "MBA", label: "MBA" }]} {...programForm.register("degreeLevel")} />
              <FormField label="Duration (semesters)" type="number" {...programForm.register("durationSemesters", { valueAsNumber: true })} />
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white"><Plus size={16} />Add Program</button></div>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Course Catalog" description="Subjects drive both timetable generation and attendance analytics." />
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={subjectForm.handleSubmit((values) => submitResource("subjects", values, subjectForm, (payload) => ({ ...payload, credits: Number(payload.credits), weeklyHours: Number(payload.weeklyHours), labHours: Number(payload.labHours), semesterNumber: Number(payload.semesterNumber) })))}>
              <FormField label="Subject Name" {...subjectForm.register("name")} />
              <FormField label="Subject Code" {...subjectForm.register("code")} />
              <FormField label="Department" as="select" options={departmentOptions} {...subjectForm.register("department")} />
              <FormField label="Program" as="select" options={programOptions(subjectForm.watch("department"))} {...subjectForm.register("program")} />
              <FormField label="Semester Number" type="number" {...subjectForm.register("semesterNumber", { valueAsNumber: true })} />
              <FormField label="Credits" type="number" {...subjectForm.register("credits", { valueAsNumber: true })} />
              <FormField label="Weekly Hours" type="number" {...subjectForm.register("weeklyHours", { valueAsNumber: true })} />
              <FormField label="Lab Hours" type="number" {...subjectForm.register("labHours", { valueAsNumber: true })} />
              <FormField label="Type" as="select" options={[{ value: "theory", label: "Theory" }, { value: "lab", label: "Lab" }, { value: "theory_lab", label: "Theory + Lab" }]} {...subjectForm.register("type")} />
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><BookOpen size={16} />Add Subject</button></div>
            </form>
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Faculty Onboarding" description="Admin-created faculty members are immediately active for login and timetable allocation." />
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={facultyForm.handleSubmit((values) => submitResource("faculty", values, facultyForm, (payload) => ({ ...payload, maxWeeklyLoad: Number(payload.maxWeeklyLoad), specialization: payload.specializationText ? payload.specializationText.split(",").map((item) => item.trim()).filter(Boolean) : [] })))}>
              <FormField label="Full Name" {...facultyForm.register("fullName")} />
              <FormField label="Staff ID" {...facultyForm.register("staffId")} />
              <FormField label="Email" type="email" {...facultyForm.register("email")} />
              <FormField label="Temporary Password" type="password" {...facultyForm.register("password")} />
              <FormField label="Phone" {...facultyForm.register("phone")} />
              <FormField label="Qualification" {...facultyForm.register("qualification")} />
              <FormField label="Department" as="select" options={departmentOptions} {...facultyForm.register("department")} />
              <FormField label="Max Weekly Load" type="number" {...facultyForm.register("maxWeeklyLoad", { valueAsNumber: true })} />
              <div className="md:col-span-2"><FormField label="Specializations / Subjects" placeholder="Java, Data Science, Operating Systems" {...facultyForm.register("specializationText")} /></div>
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white"><UserRoundCheck size={16} />Add Faculty</button></div>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Student Roster Intake" description="Create student login-ready profiles with class mapping so faculty rosters and student attendance dashboards stay aligned." />
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={studentForm.handleSubmit((values) => submitResource("students", values, studentForm, (payload) => ({ ...payload, semesterNumber: Number(payload.semesterNumber), batchYear: Number(payload.batchYear) })))}>
              <FormField label="Student Name" {...studentForm.register("fullName")} />
              <FormField label="College ID" {...studentForm.register("collegeId")} />
              <FormField label="Email" type="email" {...studentForm.register("email")} />
              <FormField label="Temporary Password" type="password" {...studentForm.register("password")} />
              <FormField label="Phone" {...studentForm.register("phone")} />
              <FormField label="Roll Number" {...studentForm.register("rollNumber")} />
              <FormField label="Department" as="select" options={departmentOptions} {...studentForm.register("department")} />
              <FormField label="Program" as="select" options={programOptions(studentForm.watch("department"))} {...studentForm.register("program")} />
              <FormField label="Semester Number" type="number" {...studentForm.register("semesterNumber", { valueAsNumber: true })} />
              <FormField label="Section" placeholder="A, B, C" {...studentForm.register("sectionName")} />
              <FormField label="Batch Year" type="number" {...studentForm.register("batchYear", { valueAsNumber: true })} />
              <FormField label="Emergency Contact" {...studentForm.register("emergencyContact")} />
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><GraduationCap size={16} />Add Student</button></div>
            </form>
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Classrooms and Laboratories" description="These room records are automatically considered during timetable generation and lab allocation." />
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={roomForm.handleSubmit((values) => submitResource(values.roomType, values, roomForm, (payload) => ({ ...payload, floor: Number(payload.floor), capacity: Number(payload.capacity), features: payload.featuresText ? payload.featuresText.split(",").map((item) => item.trim()).filter(Boolean) : [] })))}>
              <FormField label="Resource Type" as="select" options={[{ value: "classrooms", label: "Classroom" }, { value: "laboratories", label: "Laboratory" }]} {...roomForm.register("roomType")} />
              <FormField label="Name" {...roomForm.register("name")} />
              <FormField label="Code" {...roomForm.register("code")} />
              <FormField label="Building" {...roomForm.register("building")} />
              <FormField label="Floor" type="number" {...roomForm.register("floor", { valueAsNumber: true })} />
              <FormField label="Capacity" type="number" {...roomForm.register("capacity", { valueAsNumber: true })} />
              {roomForm.watch("roomType") === "laboratories" ? <FormField label="Lab Type" {...roomForm.register("labType")} /> : null}
              <div className="md:col-span-2"><FormField label="Features" placeholder="Projector, Smart board, Air conditioned" {...roomForm.register("featuresText")} /></div>
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white"><Warehouse size={16} />Add Space</button></div>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Faculty to Section Mapping" description="This is where teachers enter the timetable. Every generated period comes from these section-subject-faculty assignments." />
          <CardBody className="space-y-4">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={assignmentForm.handleSubmit((values) => submitResource("assignments", values, assignmentForm, (payload) => ({ ...payload, weeklyHoursOverride: payload.weeklyHoursOverride ? Number(payload.weeklyHoursOverride) : undefined })))}>
              <FormField label="Faculty" as="select" options={facultyOptions} {...assignmentForm.register("faculty")} />
              <FormField label="Section" as="select" options={sectionOptions} {...assignmentForm.register("section")} />
              <FormField label="Subject" as="select" options={assignmentSubjectOptions} {...assignmentForm.register("subject")} />
              <FormField label="Preferred Room Type" as="select" options={[{ value: "classroom", label: "Classroom" }, { value: "lab", label: "Laboratory" }]} {...assignmentForm.register("preferredRoomType")} />
              <FormField label="Weekly Hours Override" type="number" {...assignmentForm.register("weeklyHoursOverride")} />
              <div className="md:col-span-2 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-7 text-slate-600">
                Faculty assignments are the exact bridge between courses, teachers, rooms, and timetable generation. Once this mapping is complete for a section, the timetable draft can be generated and then published.
              </div>
              <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><Save size={16} />Create Assignment</button></div>
            </form>
          </CardBody>
        </Card>
      </div>
      <DataTable
        title="Section Readiness"
        description="Use this table to confirm each section has enough courses, faculty coverage, and roster strength before scheduling."
        data={sectionReadiness}
        columns={[
          { header: "Section", accessorFn: (row) => row.label, cell: (info) => info.getValue() },
          { header: "Subjects", accessorFn: (row) => row.subjectCount, cell: (info) => info.getValue() },
          { header: "Faculty Linked", accessorFn: (row) => row.facultyCount, cell: (info) => info.getValue() },
          { header: "Assignments", accessorFn: (row) => row.assignmentCount, cell: (info) => info.getValue() },
          { header: "Students", accessorFn: (row) => row.studentCount, cell: (info) => info.getValue() },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Faculty Directory"
          description="These faculty records become eligible for section mapping and timetable allocation."
          data={faculty}
          columns={[
            { header: "Faculty", accessorFn: (row) => row.user?.fullName, cell: (info) => info.getValue() },
            { header: "Email", accessorFn: (row) => row.user?.email, cell: (info) => info.getValue() },
            { header: "Department", accessorFn: (row) => row.department?.name, cell: (info) => info.getValue() },
            { header: "Staff ID", accessorFn: (row) => row.staffId, cell: (info) => info.getValue() },
          ]}
        />
        <DataTable
          title="Student Roster"
          description="Faculty attendance loads these section-wise student records automatically."
          data={students}
          columns={[
            { header: "Student", accessorFn: (row) => row.user?.fullName, cell: (info) => info.getValue() },
            { header: "Email", accessorFn: (row) => row.user?.email, cell: (info) => info.getValue() },
            { header: "College ID", accessorFn: (row) => row.collegeId, cell: (info) => info.getValue() },
            { header: "Section", accessorFn: (row) => row.section?.name, cell: (info) => info.getValue() },
          ]}
        />
      </div>
      <DataTable
        title="Pending Faculty Approvals"
        description="Faculty who self-register appear here. Admin-created faculty are already active and do not need this step."
        data={approvals.data || []}
        columns={[
          { header: "Faculty", accessorFn: (row) => row.user?.fullName, cell: (info) => info.getValue() },
          { header: "Staff ID", accessorFn: (row) => row.staffId, cell: (info) => info.getValue() },
          { header: "Department", accessorFn: (row) => row.department?.name, cell: (info) => info.getValue() },
          { header: "Actions", cell: ({ row }) => <button type="button" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => approve(row.original.user._id)}>Approve</button> },
        ]}
      />
    </div>
  );
}

export function TimetableWorkspacePage({ role }) {
  const isAdmin = role === "admin";
  const [refreshKey, setRefreshKey] = useState(0);
  const { data } = useApiState(() => unwrap(api.get("/timetable")), `timetable-${refreshKey}`);
  const sections = useApiState(() => unwrap(api.get("/sections")), "sections");
  const setup = useApiState(
    () => (isAdmin ? unwrap(api.get("/admin/setup-options")) : Promise.resolve(null)),
    `timetable-setup-${refreshKey}-${role}`,
  );
  const generator = useForm({
    defaultValues: {
      sectionId: "",
      periodsPerDay: 7,
      periodDurationMinutes: 60,
      lunchAfterPeriod: 4,
      lunchDurationMinutes: 45,
      dayStartTime: "09:00",
      includeSunday: false,
    },
  });

  useEffect(() => {
    if (!generator.getValues("sectionId") && sections.data?.length) {
      generator.setValue("sectionId", sections.data[0]._id);
    }
  }, [generator, sections.data]);

  const selectedSectionId = generator.watch("sectionId");
  const activeTimetable =
    (data || []).find((table) => String(table.section?._id || table.section) === String(selectedSectionId)) ||
    data?.[0];
  const selectedReadiness = (setup.data?.sectionReadiness || []).find((item) => item._id === selectedSectionId);

  async function generate(values) {
    await unwrap(api.post("/timetable/generate", values));
    setRefreshKey((value) => value + 1);
  }

  async function publish(id) {
    await unwrap(api.post(`/timetable/${id}/publish`));
    setRefreshKey((value) => value + 1);
  }

  async function exportTimetable(format) {
    if (!selectedSectionId) return;
    await downloadReport("timetable", format, { sectionId: selectedSectionId }, `timetable-${selectedSectionId}.${format === "pdf" ? "pdf" : "csv"}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Timetable Flow"
        title={isAdmin ? "Generate, review, publish, and download semester timetables" : "Published weekly timetable"}
        description="The timetable engine uses section-wise faculty assignments, subject hours, room capacity, and lab availability. First complete academic setup, then generate a draft, review conflicts, and publish the version used by faculty and students."
        actions={
          isAdmin && selectedSectionId
            ? [
                <button key="pdf" type="button" className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-sky-800" onClick={() => exportTimetable("pdf")}><Download size={16} />PDF</button>,
                <button key="csv" type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" onClick={() => exportTimetable("csv")}><Download size={16} />CSV</button>,
              ]
            : null
        }
      />
      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Faculty Assignments" value={setup.data?.readiness?.assignments || 0} hint="Each assignment creates a schedulable teaching block." icon={Users} />
          <MetricCard title="Rooms & Labs" value={setup.data?.readiness?.rooms || 0} hint="The engine allocates rooms that match section strength and lab type." icon={Warehouse} />
          <MetricCard title="Section Readiness" value={selectedReadiness ? `${selectedReadiness.subjectCount}/${selectedReadiness.assignmentCount}` : "-"} hint="Subjects available / assignments mapped for the currently selected section." icon={CalendarClock} />
        </div>
      ) : null}
      {isAdmin ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader title="Weekly Timetable Generator" description="Once faculty, courses, rooms, and section mappings are ready, create the draft and publish the approved version." />
            <CardBody className="space-y-4">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={generator.handleSubmit(generate)}>
                <FormField label="Section" as="select" options={withPlaceholder((sections.data || []).map((section) => ({ value: section._id, label: `${section.program?.name || "Program"} Semester ${section.semesterNumber} - ${section.name}` })), "Select section")} {...generator.register("sectionId")} />
                <FormField label="Periods / Day" type="number" {...generator.register("periodsPerDay", { valueAsNumber: true })} />
                <FormField label="Period Duration (mins)" type="number" {...generator.register("periodDurationMinutes", { valueAsNumber: true })} />
                <FormField label="Lunch After Period" type="number" {...generator.register("lunchAfterPeriod", { valueAsNumber: true })} />
                <FormField label="Lunch Duration (mins)" type="number" {...generator.register("lunchDurationMinutes", { valueAsNumber: true })} />
                <FormField label="Day Start Time" {...generator.register("dayStartTime")} />
                <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" id="includeSunday" {...generator.register("includeSunday")} />
                  <label htmlFor="includeSunday">Include Sunday for special weekly classes. Use this when the timetable itself should contain Sunday slots.</label>
                </div>
                <div className="md:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><Save size={16} />Generate Draft Timetable</button></div>
              </form>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="How this will work" description="This follows the workflow you asked for: prepare semester data once, then generate and publish." />
            <CardBody className="space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4"><p className="text-sm font-semibold text-slate-950">1. Add faculty, courses, rooms, and student rosters</p><p className="mt-2 text-sm leading-7 text-slate-600">Faculty profiles, subject catalog, and room inventory are all created from the Academic Setup page. Students are mapped to sections there as well.</p></div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4"><p className="text-sm font-semibold text-slate-950">2. Map faculty to subjects and sections</p><p className="mt-2 text-sm leading-7 text-slate-600">Teachers are added to the timetable through faculty assignments. That mapping tells the scheduler which faculty member is eligible to teach each section subject and whether a room or lab is needed.</p></div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4"><p className="text-sm font-semibold text-slate-950">3. Generate, review, publish, and download</p><p className="mt-2 text-sm leading-7 text-slate-600">Once the draft looks right, publish it. Faculty attendance loads from the published timetable, students see the same schedule in their portal, and you can export the final timetable as PDF or CSV from this page.</p></div>
            </CardBody>
          </Card>
        </div>
      ) : null}
      <DataTable
        title="Timetable Versions"
        description="Draft versions are kept until you publish the semester-ready timetable."
        data={data || []}
        columns={[
          { header: "Title", accessorFn: (row) => row.title, cell: (info) => info.getValue() },
          { header: "Section", accessorFn: (row) => row.section?.name, cell: (info) => info.getValue() },
          { header: "Version", accessorFn: (row) => row.version, cell: (info) => `v${info.getValue()}` },
          { header: "Status", accessorFn: (row) => row.status, cell: (info) => <Badge tone={info.getValue() === "published" ? "success" : "info"}>{info.getValue()}</Badge> },
          { header: "Conflicts", accessorFn: (row) => row.conflicts?.length || 0, cell: (info) => info.getValue() },
          { header: "Actions", cell: ({ row }) => isAdmin ? <button type="button" className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => publish(row.original._id)}>Publish</button> : <span className="text-xs text-slate-500">Read only</span> },
        ]}
      />
      <Card>
        <CardHeader title="Weekly Grid" description="Preview of the latest timetable version for the selected section." />
        <CardBody>
          {activeTimetable ? <WeeklyGrid timetable={activeTimetable} /> : <EmptyState title="No timetable available" description="Generate or publish a timetable to view it here." />}
        </CardBody>
      </Card>
    </div>
  );
}
