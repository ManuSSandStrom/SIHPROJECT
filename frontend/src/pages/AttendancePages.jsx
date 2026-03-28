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
  const [submitState, setSubmitState] = useState({
    loading: false,
    tone: "success",
    message: "",
  });
  const rosterSectionId = isFaculty ? selectedPeriod?.section?._id || "" : selectedSection;
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
    () => ((isAdmin || isFaculty) && rosterSectionId ? unwrap(api.get(`/attendance/roster/${rosterSectionId}`)) : Promise.resolve([])),
    `${role}-${rosterSectionId || "empty-section"}`,
  );

  useEffect(() => {
    if (!isFaculty && !selectedSection && sections.data?.length) {
      setSelectedSection(sections.data[0]._id);
    }
  }, [isFaculty, sections.data, selectedSection]);

  useEffect(() => {
    if (isFaculty) {
      setStatusMap({});
      setSubmitState({ loading: false, tone: "success", message: "" });
    }
  }, [isFaculty, rosterSectionId, selectedPeriod]);

  async function submitFacultyAttendance() {
    if (!selectedPeriod || !roster.data?.length) {
      setSubmitState({
        loading: false,
        tone: "error",
        message: "Select a scheduled period and wait for the section roster to load before submitting attendance.",
      });
      return;
    }

    setSubmitState({ loading: true, tone: "success", message: "" });

    try {
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
      setSubmitState({
        loading: false,
        tone: "success",
        message: `Attendance submitted for ${selectedPeriod.section?.name} period ${selectedPeriod.periodNumber}.`,
      });
    } catch (error) {
      setSubmitState({
        loading: false,
        tone: "error",
        message: error?.response?.data?.message || "Unable to submit attendance right now.",
      });
    }
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
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Total Sessions" value={analytics.data?.totalSessions || 0} hint="Recorded attendance sessions" icon={CalendarClock} />
            <MetricCard title="Attendance Records" value={analytics.data?.totalRecords || 0} hint="Individual student attendance entries" icon={ClipboardCheck} />
            <MetricCard title="Daily Absentees" value={analytics.data?.dailyAbsentees?.length || 0} hint="Students absent across tracked sessions" icon={ShieldAlert} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <Card>
              <CardHeader title="Roster Master Data" description="Add student records from Academic Setup, then faculty attendance will automatically use the same section roster." />
              <CardBody className="space-y-4">
                <FormField
                  label="Section"
                  as="select"
                  options={(sections.data || []).map((section) => ({
                    value: section._id,
                    label: `${section.program?.name || "Program"} Semester ${section.semesterNumber} - ${section.name}`,
                  }))}
                  value={selectedSection}
                  onChange={(event) => setSelectedSection(event.target.value)}
                />
                <div className="rounded-[22px] border border-sky-100 bg-sky-50/70 p-4 text-sm leading-7 text-slate-600">
                  Faculty see this same section roster during attendance marking. Students then see those submitted attendance records inside their own login dashboard.
                </div>
              </CardBody>
            </Card>
            <DataTable
              title="Section Student Roster"
              description="This roster is the source list used when faculty mark attendance for published timetable periods."
              data={roster.data || []}
              columns={[
                { header: "Student", accessorFn: (row) => row.user?.fullName, cell: (info) => info.getValue() },
                { header: "Email", accessorFn: (row) => row.user?.email, cell: (info) => info.getValue() },
                { header: "College ID", accessorFn: (row) => row.collegeId, cell: (info) => info.getValue() },
                { header: "Section", accessorFn: (row) => row.section?.name, cell: (info) => info.getValue() },
              ]}
            />
          </div>
        </>
      ) : null}
      {isFaculty ? (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader title="Today's Assigned Periods" description="Published periods linked to your faculty profile." />
            <CardBody className="space-y-3">
              {(facultyPeriods.data || []).map((period) => (
                <button key={period._id} type="button" className={`w-full rounded-[22px] border px-4 py-4 text-left ${selectedPeriod?._id === period._id ? "border-sky-500 bg-sky-50" : "border-sky-100 bg-white"}`} onClick={() => { setSelectedPeriod(period); }}>
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
              {submitState.message ? (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${submitState.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {submitState.message}
                </div>
              ) : null}
              {roster.data?.length ? <button type="button" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={submitFacultyAttendance} disabled={submitState.loading}>{submitState.loading ? "Submitting Attendance..." : "Submit Attendance"}</button> : null}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
