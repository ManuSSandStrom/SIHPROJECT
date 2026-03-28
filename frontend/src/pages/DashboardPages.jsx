import { CalendarClock, ClipboardCheck, MessagesSquare, ShieldAlert, Users } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { MetricCard } from "../components/common/MetricCard";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { TrendChart } from "../components/charts/TrendChart";
import { api, unwrap } from "../api/client";
import { Badge } from "../components/common/Badge";
import { percentage } from "../utils/formatters";
import { useApiState } from "../hooks/useApiState";

function WeeklyGrid({ timetable }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[900px] grid-cols-7 gap-3">
        {days.map((day) => {
          const entries = (timetable?.entries || [])
            .filter((entry) => entry.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          return (
            <div key={day} className="rounded-[24px] border border-sky-100 bg-sky-50/60 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-slate-950">{day}</h4>
                {day === "Sunday" ? <Badge tone="warning">Special</Badge> : null}
              </div>
              <div className="space-y-3">
                {!entries.length ? <div className="rounded-2xl bg-white/80 px-3 py-4 text-sm text-slate-400">No sessions</div> : null}
                {entries.map((entry) => (
                  <div key={entry._id || `${entry.day}-${entry.periodNumber}`} className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-slate-950">{entry.subject?.name || "Subject"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Period {entry.periodNumber} - {entry.startTime} - {entry.endTime}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">{entry.roomLabel || entry.classroom?.name || entry.laboratory?.name || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, loading } = useApiState(() => unwrap(api.get("/dashboard/summary")), "admin-dashboard");
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin Dashboard" title="Academic operations command center" description="Monitor people, scheduling, attendance, issues, and feedback from one secure control room." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Students" value={stats.totalStudents || 0} hint="Institutional student records" icon={Users} />
        <MetricCard title="Total Faculty" value={stats.totalFaculty || 0} hint="Approved and pending faculty" icon={Users} />
        <MetricCard title="Attendance Today" value={percentage(stats.todayAttendancePercentage)} hint="Present classes captured today" icon={ClipboardCheck} />
        <MetricCard title="Open Issues" value={stats.openIssues || 0} hint="Pending issue desk workload" icon={ShieldAlert} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <TrendChart title="Issue Workflow Distribution" description="Open, under review, and solved issue counts" data={data?.charts?.issueTrend || []} dataKey="count" variant="bar" />
        <TrendChart title="Feedback Trend" description="Monthly lecturer feedback performance" data={data?.charts?.feedbackTrend || []} dataKey="averageRating" />
      </div>
      {!loading && !data ? <EmptyState title="Dashboard unavailable" description="Please verify the backend is running and you are logged in as admin." /> : null}
    </div>
  );
}

export function FacultyDashboardPage() {
  const { data } = useApiState(() => unwrap(api.get("/dashboard/summary")), "faculty-dashboard");
  const classes = data?.todayClasses || [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Faculty Dashboard" title="Your teaching and attendance workspace" description="See today’s classes, monitor pending attendance, and move directly into scheduled academic work." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Today's Classes" value={classes.length} hint="Scheduled periods from the published timetable" icon={CalendarClock} />
        <MetricCard title="Timetable Records" value={data?.timetableCount || 0} hint="Available timetable snapshots" icon={ClipboardCheck} />
        <MetricCard title="Role" value="Faculty" hint="Approved staff workspace" icon={Users} />
      </div>
      <Card>
        <CardHeader title="Today's Schedule" description="Classes assigned to you today." />
        <CardBody className="space-y-3">
          {!classes.length ? <EmptyState title="No classes today" description="Your published timetable does not show any classes for today." /> : null}
          {classes.map((entry) => (
            <div key={entry._id} className="rounded-[22px] border border-sky-100 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{entry.subject?.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {entry.section?.name} - Period {entry.periodNumber} - {entry.startTime} - {entry.endTime}
                  </p>
                </div>
                <Badge>{entry.roomLabel}</Badge>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

export function StudentDashboardPage() {
  const { data } = useApiState(() => unwrap(api.get("/dashboard/summary")), "student-dashboard");
  const attendance = data?.attendance || {};
  const latestTimetable = data?.latestTimetable;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student Dashboard" title="Your academic snapshot for the week" description="Track attendance, timetable, active feedback cycles, and support requests from one portal." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Attendance" value={percentage(attendance.overallPercentage)} hint={`Status: ${attendance.shortageBand || "healthy"}`} icon={ClipboardCheck} />
        <MetricCard title="Open Issues" value={data?.issuesCount || 0} hint="Issues you have submitted" icon={ShieldAlert} />
        <MetricCard title="Active Feedback" value={data?.activeFeedbackCycles || 0} hint="Live lecturer feedback cycles" icon={MessagesSquare} />
      </div>
      <Card>
        <CardHeader title="Current Timetable" description="Published weekly timetable for your section." />
        <CardBody>
          {latestTimetable ? <WeeklyGrid timetable={latestTimetable} /> : <EmptyState title="No timetable published" description="Your admin has not published a timetable for this section yet." />}
        </CardBody>
      </Card>
    </div>
  );
}
