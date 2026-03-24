import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { InputField, SectionCard, SelectField } from "./PortalUI";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const api = axios.create({ baseURL: `${API_BASE_URL}/api`, timeout: 10000 });

const statusOptions = [
  { label: "Present", value: "present" },
  { label: "Absent", value: "absent" },
  { label: "Late", value: "late" },
  { label: "Excused", value: "excused" },
];

export function LecturerWorkspaceSection({ currentUser, onSubmitAttendance, refreshToken = 0, showMessage }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [workspace, setWorkspace] = useState({ lecturer: null, assignments: [] });
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.email && !currentUser?.staffId) {
      return;
    }

    async function fetchWorkspace() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/attendance/lecturer-workspace", {
          params: {
            email: currentUser?.email,
            staffId: currentUser?.staffId,
            date: selectedDate,
          },
        });
        setWorkspace(response.data);
        const firstAssignment = response.data.assignments?.[0];
        setSelectedAssignmentId((previous) => previous || firstAssignment?.entryId || "");
      } catch (requestError) {
        setWorkspace({ lecturer: null, assignments: [] });
        setSelectedAssignmentId("");
        setError(requestError.response?.data?.error || "Unable to load lecturer attendance workspace.");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspace();
  }, [currentUser?.email, currentUser?.staffId, selectedDate, refreshToken]);

  const selectedAssignment = useMemo(
    () => workspace.assignments?.find((item) => item.entryId === selectedAssignmentId) || workspace.assignments?.[0] || null,
    [workspace.assignments, selectedAssignmentId]
  );

  useEffect(() => {
    if (!selectedAssignment) {
      setStatusMap({});
      return;
    }

    const nextMap = {};
    selectedAssignment.students.forEach((student) => {
      nextMap[student._id] = student.status || "present";
    });
    setStatusMap(nextMap);
  }, [selectedAssignment]);

  async function submitAttendance(event) {
    event.preventDefault();
    if (!selectedAssignment) {
      return;
    }

    const records = selectedAssignment.students.map((student) => ({
      studentId: student._id,
      studentName: student.name,
      collegeId: student.collegeId,
      rollNumber: student.rollNumber,
      department: selectedAssignment.department,
      section: selectedAssignment.section,
      semester: selectedAssignment.semester,
      courseCode: selectedAssignment.courseCode,
      courseName: selectedAssignment.courseName,
      facultyId: selectedAssignment.facultyId,
      facultyName: selectedAssignment.facultyName,
      date: selectedAssignment.date,
      slotLabel: selectedAssignment.slotLabel,
      sessionType: selectedAssignment.sessionType,
      status: statusMap[student._id] || "present",
      markedBy: currentUser?.name || selectedAssignment.facultyName,
      markedByRole: "lecturer",
    }));

    await onSubmitAttendance(records);
    showMessage?.("Attendance saved for the selected scheduled period.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <SectionCard
        title="Lecturer attendance workspace"
        description="Pick the scheduled period for the day and mark attendance for the mapped department, semester, and section."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <InputField label="Lecturer" value={currentUser?.name || ""} onChange={() => {}} disabled />
          <InputField label="Date" type="date" value={selectedDate} onChange={setSelectedDate} />
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-sky-700">
            Loading lecturer schedule...
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            {error}
          </div>
        ) : null}

        {workspace.assignments?.length ? (
          <form className="mt-5 grid gap-3" onSubmit={submitAttendance}>
            <SelectField
              label="Scheduled period"
              value={selectedAssignment?.entryId || ""}
              onChange={setSelectedAssignmentId}
              options={workspace.assignments.map((assignment) => ({
                label: `${assignment.subjectName} - ${assignment.department} ${assignment.section} - ${assignment.slotLabel}`,
                value: assignment.entryId,
              }))}
            />
            {selectedAssignment ? (
              <div className="grid gap-3 md:grid-cols-3">
                <InputField label="Department" value={selectedAssignment.department} onChange={() => {}} disabled />
                <InputField label="Section" value={selectedAssignment.section} onChange={() => {}} disabled />
                <InputField label="Semester" value={selectedAssignment.semester} onChange={() => {}} disabled />
              </div>
            ) : null}
            <button type="submit" className="primary-button justify-center" disabled={!selectedAssignment}>
              Save lecturer attendance
            </button>
          </form>
        ) : !loading && !error ? (
          <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">
            No scheduled periods were found for this lecturer on the selected date.
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Student list for selected period"
        description="Attendance is saved against the scheduled subject and period so admins can report by section and date."
      >
        {!selectedAssignment ? (
          <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">
            Select a scheduled period to load the assigned student roster.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedAssignment.students.map((student) => (
              <div key={student._id} className="list-row">
                <div>
                  <p className="font-semibold text-slate-950">{student.name}</p>
                  <p className="text-sm text-slate-500">
                    {student.rollNumber || student.collegeId} - {selectedAssignment.department} - Section {selectedAssignment.section}
                  </p>
                </div>
                <div className="min-w-44">
                  <SelectField
                    label="Status"
                    value={statusMap[student._id] || "present"}
                    onChange={(value) => setStatusMap((previous) => ({ ...previous, [student._id]: value }))}
                    options={statusOptions}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
