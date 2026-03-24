import { useMemo, useState } from "react";
import { InputField, SectionCard, SelectField } from "./PortalUI";

const defaultPlanner = {
  department: "Computer Science",
  section: "A",
  semester: 5,
  courseCode: "CS501",
  courseName: "Machine Learning",
  facultyName: "Dr. Meera Iyer",
  slotLabel: "09:00 - 10:00",
  sessionType: "lecture",
  date: new Date().toISOString().slice(0, 10),
};

export function AttendanceSection({
  attendance,
  users,
  holidays,
  handleBulkAttendanceSubmit,
}) {
  const [planner, setPlanner] = useState(defaultPlanner);
  const [statusMap, setStatusMap] = useState({});

  const students = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "student" &&
          user.department === planner.department &&
          user.section === planner.section
      ),
    [users, planner.department, planner.section]
  );

  const dayHoliday = holidays.find((holiday) => {
    const holidayDate = new Date(holiday.date).toISOString().slice(0, 10);
    return (
      holidayDate === planner.date &&
      (holiday.department === "All Departments" || holiday.department === planner.department) &&
      (holiday.section === "All Sections" || holiday.section === planner.section)
    );
  });

  function submitAttendance(event) {
    event.preventDefault();

    const records = students.map((student) => ({
      studentId: student._id,
      studentName: student.name,
      collegeId: student.collegeId,
      department: student.department,
      section: student.section,
      semester: student.semester,
      courseCode: planner.courseCode,
      courseName: planner.courseName,
      facultyName: planner.facultyName,
      date: planner.date,
      slotLabel: planner.slotLabel,
      sessionType: planner.sessionType,
      status: dayHoliday ? "present" : statusMap[student._id] || "present",
      markedBy: "Admin",
      isHoliday: Boolean(dayHoliday),
      holidayTitle: dayHoliday?.title || "",
    }));

    handleBulkAttendanceSubmit(records);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title="Attendance management"
        description="Choose a department and section, view the student roster, and record daily attendance professionally."
      >
        <form className="grid gap-3" onSubmit={submitAttendance}>
          <div className="grid gap-3 md:grid-cols-3">
            <InputField label="Department" value={planner.department} onChange={(value) => setPlanner({ ...planner, department: value })} />
            <InputField label="Section" value={planner.section} onChange={(value) => setPlanner({ ...planner, section: value.toUpperCase() })} />
            <InputField label="Semester" type="number" value={planner.semester} onChange={(value) => setPlanner({ ...planner, semester: Number(value) })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Course code" value={planner.courseCode} onChange={(value) => setPlanner({ ...planner, courseCode: value.toUpperCase() })} />
            <InputField label="Course name" value={planner.courseName} onChange={(value) => setPlanner({ ...planner, courseName: value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <InputField label="Lecturer" value={planner.facultyName} onChange={(value) => setPlanner({ ...planner, facultyName: value })} />
            <InputField label="Date" type="date" value={planner.date} onChange={(value) => setPlanner({ ...planner, date: value })} />
            <SelectField
              label="Session type"
              value={planner.sessionType}
              onChange={(value) => setPlanner({ ...planner, sessionType: value })}
              options={[
                { label: "Lecture", value: "lecture" },
                { label: "Lab", value: "lab" },
                { label: "Tutorial", value: "tutorial" },
                { label: "Special", value: "special" },
              ]}
            />
          </div>
          <InputField label="Time slot" value={planner.slotLabel} onChange={(value) => setPlanner({ ...planner, slotLabel: value })} />

          {dayHoliday ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              Holiday detected: {dayHoliday.title}. Full attendance will be applied automatically for this section.
            </div>
          ) : null}

          <button type="submit" className="primary-button justify-center">Save daily attendance</button>
        </form>
      </SectionCard>

      <SectionCard
        title="Student roster for attendance"
        description="Students added in the admin portal appear here automatically for daily attendance taking."
      >
        <div className="space-y-3">
          {students.length === 0 ? (
            <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-600">
              No students found for {planner.department} Section {planner.section}. Add them from the admin portal first.
            </div>
          ) : null}

          {students.map((student) => (
            <div key={student._id} className="list-row">
              <div>
                <p className="font-semibold text-slate-950">{student.name}</p>
                <p className="text-sm text-slate-500">
                  {student.collegeId} • {student.department} • Section {student.section}
                </p>
              </div>
              <div className="min-w-40">
                <SelectField
                  label="Status"
                  value={dayHoliday ? "present" : statusMap[student._id] || "present"}
                  onChange={(value) => setStatusMap({ ...statusMap, [student._id]: value })}
                  options={[
                    { label: "Present", value: "present" },
                    { label: "Absent", value: "absent" },
                    { label: "Late", value: "late" },
                    { label: "Excused", value: "excused" },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {attendance.slice(0, 6).map((record) => (
            <div key={record._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
              <p className="font-semibold text-slate-950">{record.studentName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {record.courseCode} • {record.department || "Department"} • Section {record.section || "-"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`pill ${record.status === "present" ? "pill-success" : "pill-warning"}`}>{record.status}</span>
                <span className="text-xs text-slate-500">{new Date(record.date || record.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
