import { useEffect, useState } from "react";
import { CalendarClock, ClipboardCheck, ShieldAlert, Users } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { MetricCard } from "../components/common/MetricCard";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { FormField } from "../components/forms/FormField";
import { DataTable } from "../components/data/DataTable";
import { api, unwrap } from "../api/client";
import { percentage } from "../utils/formatters";
import { useApiState } from "../hooks/useApiState";

export function AttendanceWorkspacePage({ role }) {
  const isAdmin = role === "admin";
  const isFaculty = role === "faculty";
  const isStudent = role === "student";
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const analytics = useApiState(
    () => (isAdmin ? unwrap(api.get("/attendance/analytics")) : Promise.resolve(null)),
    `attendance-analytics-${role}`,
  );
  const studentAttendance = useApiState(
    () => (isStudent ? unwrap(api.get("/attendance/student-dashboard")) : Promise.resolve(null)),
    `student-attendance-${role}`,
  );
  const facultyPeriods = useApiState(
    () => (isFaculty ? unwrap(api.get("/attendance/today-periods")) : Promise.resolve([])),
    `faculty-periods-${role}`,
  );
  const sections = useApiState(
    () => ((isAdmin || isFaculty) ? unwrap(api.get("/sections")) : Promise.resolve([])),
    `attendance-sections-${role}`,
  );
  const roster = useApiState(
    () => ((isAdmin || isFaculty) && selectedSection ? unwrap(api.get(`/attendance/roster/${selectedSection}`)) : Promise.resolve([])),
    `${role}-${selectedSection || "empty-section"}`,
  );

  useEffect(() => {
    if (!selectedSection && sections.data?.length) {
      setSelectedSection(sections.data[0]._id);
    }
  }, [sections.data, selectedSection]);

  async function submitFacultyAttendance() {
    if (!selectedPeriod) return;
    const session = await unwrap(
      api.post("/attendance/sessions", {
        sectionId: selectedPeriod.section._id,
        subjectId: selectedPeriod.subject._id,
        facultyId: selectedPeriod.faculty?._id,
        timetableEntryId: selectedPeriod._id,
        date: new Date().toISOString().slice(0, 10),
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        periodNumber: selectedPeriod.periodNumber,
      }),
    );
    await unwrap(
      api.post("/attendance/submit", {
        sessionId: session._id,
        records: (roster.data || []).map((student) => ({
          studentId: student._id,
          status: statusMap[student._id] || "present",
        })),
      }),
    );
  }

  if (isStudent) {
    const data = studentAttendance.data || {};
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="My Attendance" title="Attendance performance and shortage tracking" description="Review your overall percentage, subject-wise performance, and shortage status." />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Overall Attendance" value={percentage(data.overallPercentage)} hint={`Band: ${data.shortageBand || "healthy"}`} icon={ClipboardCheck} />
          <MetricCard title="Attended Classes" value={data.attendedClasses || 0} hint="Present, late, or excused sessions" icon={CalendarClock} />
          <MetricCard title="Total Classes" value={data.totalClasses || 0} hint="Recorded attendance sessions" icon={Users} />
        </div>
        <DataTable
          title="Subject-wise Attendance"
          description="Subject-level percentages for your current semester."
          data={data.subjectWise || []}
          columns={[
            { header: "Subject", accessorFn: (row) => row.subjectName, cell: (info) => info.getValue() },
            { header: "Code", accessorFn: (row) => row.subjectCode, cell: (info) => info.getValue() },
            { header: "Attendance", accessorFn: (row) => percentage(row.percentage), cell: (info) => info.getValue() },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Attendance" title={isAdmin ? "Attendance oversight and analytics" : "Timetable-driven attendance marking"} description={isAdmin ? "Monitor absentee trends, submission coverage, and section-level attendance health." : "Choose a scheduled period, load the roster, and submit attendance for the active class."} />
      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Total Sessions" value={analytics.data?.totalSessions || 0} hint="Recorded attendance sessions" icon={CalendarClock} />
          <MetricCard title="Attendance Records" value={analytics.data?.totalRecords || 0} hint="Individual student attendance entries" icon={ClipboardCheck} />
          <MetricCard title="Daily Absentees" value={analytics.data?.dailyAbsentees?.length || 0} hint="Students absent across tracked sessions" icon={ShieldAlert} />
        </div>
      ) : null}
      {isFaculty ? (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader title="Today's Assigned Periods" description="Published periods linked to your faculty profile." />
            <CardBody className="space-y-3">
              {(facultyPeriods.data || []).map((period) => (
                <button key={period._id} type="button" className={`w-full rounded-[22px] border px-4 py-4 text-left ${selectedPeriod?._id === period._id ? "border-sky-500 bg-sky-50" : "border-sky-100 bg-white"}`} onClick={() => { setSelectedPeriod(period); setSelectedSection(period.section._id); }}>
                  <p className="font-semibold text-slate-950">{period.subject?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{period.section?.name} - Period {period.periodNumber} - {period.startTime} - {period.endTime}</p>
                </button>
              ))}
              {!facultyPeriods.data?.length ? <EmptyState title="No periods assigned today" description="Your published timetable has no active periods for today." /> : null}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Section Roster" description="Mark each student as present, absent, late, or excused." />
            <CardBody className="space-y-3">
              {(roster.data || []).map((student) => (
                <div key={student._id} className="grid gap-3 rounded-[22px] border border-sky-100 bg-slate-50/80 p-4 md:grid-cols-[1fr_220px] md:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{student.user?.fullName}</p>
                    <p className="text-sm text-slate-500">{student.collegeId}</p>
                  </div>
                  <FormField
                    label="Status"
                    as="select"
                    value={statusMap[student._id] || "present"}
                    onChange={(event) => setStatusMap((previous) => ({ ...previous, [student._id]: event.target.value }))}
                    options={[
                      { value: "present", label: "Present" },
                      { value: "absent", label: "Absent" },
                      { value: "late", label: "Late" },
                      { value: "excused", label: "Excused" },
                    ]}
                  />
                </div>
              ))}
              {!roster.data?.length ? <EmptyState title="Select a period" description="Choose one of your assigned periods to load the roster." /> : null}
              {roster.data?.length ? <button type="button" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={submitFacultyAttendance}>Submit Attendance</button> : null}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
