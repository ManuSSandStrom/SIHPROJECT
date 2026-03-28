import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { FormField } from "../components/forms/FormField";
import { DataTable } from "../components/data/DataTable";
import { api, unwrap } from "../api/client";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { titleCase } from "../utils/formatters";
import { useApiState } from "../hooks/useApiState";

const resourceFields = {
  departments: [
    { name: "name", label: "Department Name" },
    { name: "code", label: "Code" },
    { name: "hodName", label: "HOD Name" },
    { name: "description", label: "Description" },
  ],
  programs: [
    { name: "name", label: "Program Name" },
    { name: "code", label: "Program Code" },
    { name: "department", label: "Department ID" },
    { name: "degreeLevel", label: "Degree Level" },
    { name: "durationSemesters", label: "Duration (Semesters)", type: "number" },
  ],
  sections: [
    { name: "name", label: "Section Name" },
    { name: "code", label: "Section Code" },
    { name: "department", label: "Department ID" },
    { name: "program", label: "Program ID" },
    { name: "semesterNumber", label: "Semester Number", type: "number" },
    { name: "batchYear", label: "Batch Year", type: "number" },
    { name: "strength", label: "Strength", type: "number" },
  ],
  subjects: [
    { name: "name", label: "Subject Name" },
    { name: "code", label: "Subject Code" },
    { name: "department", label: "Department ID" },
    { name: "program", label: "Program ID" },
    { name: "semesterNumber", label: "Semester Number", type: "number" },
    { name: "weeklyHours", label: "Weekly Hours", type: "number" },
    { name: "labHours", label: "Lab Hours", type: "number" },
    { name: "type", label: "Type", as: "select", options: [{ value: "theory", label: "Theory" }, { value: "lab", label: "Lab" }, { value: "theory_lab", label: "Theory + Lab" }] },
  ],
  classrooms: [
    { name: "name", label: "Classroom Name" },
    { name: "code", label: "Code" },
    { name: "building", label: "Building" },
    { name: "floor", label: "Floor", type: "number" },
    { name: "capacity", label: "Capacity", type: "number" },
  ],
  laboratories: [
    { name: "name", label: "Lab Name" },
    { name: "code", label: "Code" },
    { name: "building", label: "Building" },
    { name: "floor", label: "Floor", type: "number" },
    { name: "capacity", label: "Capacity", type: "number" },
    { name: "labType", label: "Lab Type" },
  ],
  assignments: [
    { name: "faculty", label: "Faculty Profile ID" },
    { name: "subject", label: "Subject ID" },
    { name: "department", label: "Department ID" },
    { name: "program", label: "Program ID" },
    { name: "section", label: "Section ID" },
    { name: "semesterNumber", label: "Semester Number", type: "number" },
    { name: "preferredRoomType", label: "Room Type", as: "select", options: [{ value: "classroom", label: "Classroom" }, { value: "lab", label: "Lab" }] },
  ],
};

function WeeklyGrid({ timetable }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[900px] grid-cols-7 gap-3">
        {days.map((day) => (
          <div key={day} className="rounded-[24px] border border-sky-100 bg-sky-50/80 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-950">{day}</h4>
              {day === "Sunday" ? <Badge tone="warning">Special</Badge> : null}
            </div>
            <div className="space-y-3">
              {(timetable?.entries || [])
                .filter((entry) => entry.day === day)
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((entry) => (
                  <div key={entry._id || `${day}-${entry.periodNumber}`} className="rounded-2xl bg-white p-3">
                    <p className="text-sm font-semibold text-slate-950">{entry.subject?.name || "Subject"}</p>
                    <p className="text-xs text-slate-500">P{entry.periodNumber} - {entry.startTime} - {entry.endTime}</p>
                    <p className="text-xs text-slate-500">{entry.roomLabel || "-"}</p>
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
  const [resource, setResource] = useState("departments");
  const [refreshKey, setRefreshKey] = useState(0);
  const { data } = useApiState(() => unwrap(api.get(`/admin/master/${resource}`)), `${resource}-${refreshKey}`);
  const approvals = useApiState(() => unwrap(api.get("/admin/faculty-approvals")), `approvals-${refreshKey}`);
  const form = useForm({ defaultValues: {} });

  useEffect(() => {
    form.reset({});
  }, [form, resource]);

  async function onSubmit(values) {
    await unwrap(api.post(`/admin/master/${resource}`, values));
    form.reset({});
    setRefreshKey((value) => value + 1);
  }

  async function approve(userId) {
    await unwrap(api.post(`/admin/faculty-approvals/${userId}/approve`));
    setRefreshKey((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin Operations" title="Master data and approval management" description="Create departments, programs, sections, subjects, rooms, labs, and faculty assignments, then approve incoming faculty access requests." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Create Resource" description="Use the selected resource schema to create new academic records." />
          <CardBody className="space-y-4">
            <FormField label="Resource" as="select" options={Object.keys(resourceFields).map((key) => ({ value: key, label: titleCase(key) }))} value={resource} onChange={(event) => setResource(event.target.value)} />
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
              {resourceFields[resource].map((field) => (
                <FormField key={field.name} label={field.label} type={field.type} as={field.as} options={field.options} {...form.register(field.name)} />
              ))}
              <div className="md:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                  <Plus size={16} />
                  Create Record
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
        <DataTable
          title={`${titleCase(resource)} Records`}
          description="Recent entries from the selected master data module."
          data={data?.items || []}
          columns={[
            { header: "Name", accessorFn: (row) => row.name || row.code || row.title || row.staffId || row.collegeId, cell: (info) => info.getValue() },
            { header: "Code / ID", accessorFn: (row) => row.code || row.staffId || row.collegeId || row._id, cell: (info) => info.getValue() },
            { header: "Created", accessorFn: (row) => row.createdAt?.slice(0, 10), cell: (info) => info.getValue() },
          ]}
        />
      </div>
      <DataTable
        title="Pending Faculty Approvals"
        description="Review and approve faculty registration requests."
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

  async function generate(values) {
    await unwrap(api.post("/timetable/generate", values));
    setRefreshKey((value) => value + 1);
  }

  async function publish(id) {
    await unwrap(api.post(`/timetable/${id}/publish`));
    setRefreshKey((value) => value + 1);
  }

  const activeTimetable = data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Timetable" title={isAdmin ? "Generate and publish weekly timetables" : "Published weekly timetable"} description="Schedules are built from section-subject-faculty mappings with weekly conflict checks." />
      {isAdmin ? (
        <Card>
          <CardHeader title="Weekly Timetable Generator" description="Create a one-week timetable for the selected section." />
          <CardBody>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={generator.handleSubmit(generate)}>
              <FormField label="Section" as="select" options={(sections.data || []).map((section) => ({ value: section._id, label: `${section.name} (${section.code})` }))} {...generator.register("sectionId")} />
              <FormField label="Periods / Day" type="number" {...generator.register("periodsPerDay", { valueAsNumber: true })} />
              <FormField label="Period Duration (mins)" type="number" {...generator.register("periodDurationMinutes", { valueAsNumber: true })} />
              <FormField label="Lunch After Period" type="number" {...generator.register("lunchAfterPeriod", { valueAsNumber: true })} />
              <FormField label="Lunch Duration (mins)" type="number" {...generator.register("lunchDurationMinutes", { valueAsNumber: true })} />
              <FormField label="Day Start Time" {...generator.register("dayStartTime")} />
              <div className="md:col-span-3 flex items-center gap-3">
                <input type="checkbox" id="includeSunday" {...generator.register("includeSunday")} />
                <label htmlFor="includeSunday" className="text-sm text-slate-700">Include Sunday special classes</label>
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                  <Save size={16} />
                  Generate Timetable
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <DataTable
        title="Timetable Versions"
        description="Review generated drafts and publish the final schedule for section stakeholders."
        data={data || []}
        columns={[
          { header: "Title", accessorFn: (row) => row.title, cell: (info) => info.getValue() },
          { header: "Version", accessorFn: (row) => row.version, cell: (info) => `v${info.getValue()}` },
          { header: "Status", accessorFn: (row) => row.status, cell: (info) => <Badge tone={info.getValue() === "published" ? "success" : "info"}>{info.getValue()}</Badge> },
          { header: "Conflicts", accessorFn: (row) => row.conflicts?.length || 0, cell: (info) => info.getValue() },
          { header: "Actions", cell: ({ row }) => isAdmin ? <button type="button" className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => publish(row.original._id)}>Publish</button> : <span className="text-xs text-slate-500">Read only</span> },
        ]}
      />
      <Card>
        <CardHeader title="Weekly Grid" description="Preview of the latest timetable version." />
        <CardBody>
          {activeTimetable ? <WeeklyGrid timetable={activeTimetable} /> : <EmptyState title="No timetable available" description="Generate or publish a timetable to view it here." />}
        </CardBody>
      </Card>
    </div>
  );
}
