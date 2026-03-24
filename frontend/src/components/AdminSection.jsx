import { InputField, MiniPanel, SectionCard, SelectField, TextAreaField } from "./PortalUI";

export function AdminSection({
  lecturerForm,
  setLecturerForm,
  studentForm,
  setStudentForm,
  holidayForm,
  setHolidayForm,
  faculty,
  users,
  issues,
  feedback,
  holidays,
  attendance,
  dashboard,
  handleCreateStudent,
  handleCreateHoliday,
  submitRecord,
  emptyLecturerForm,
  handleFeedbackStatusChange,
}) {
  const presentCount = attendance.filter((item) => item.status === "present").length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Admin login details" description="Use this admin account to enter the control portal and manage operations.">
          <div className="space-y-3 rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-sm font-medium text-slate-500">Default admin email</p>
            <p className="text-lg font-semibold text-slate-950">admin@blueboard.edu</p>
            <p className="text-sm font-medium text-slate-500">Default admin password</p>
            <p className="text-lg font-semibold text-slate-950">Admin@123</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Change this after first live login in production. It exists so the admin portal is immediately usable.
          </p>
        </SectionCard>

        <SectionCard title="Operations monitor" description="Overview of registrations, attendance, support, and lecturer feedback.">
          <div className="grid gap-4">
            <MiniPanel title="Registered students" value={users.filter((user) => user.role === "student").length} subtitle="Added from admin portal" />
            <MiniPanel title="Attendance rate" value={`${attendanceRate}%`} subtitle="Daily records and holiday attendance" />
            <MiniPanel title="Open support tickets" value={issues.filter((issue) => issue.status !== "closed").length} subtitle="Complaint resolution queue" />
            <MiniPanel title="Holiday count" value={dashboard?.kpis?.holidayCount || holidays.length} subtitle="Admin-created attendance holidays" />
          </div>
        </SectionCard>

        <SectionCard title="Lecturer feedback control" description="Students rate lecturers and the admin portal manages the review workflow.">
          <div className="space-y-3">
            {feedback.slice(0, 4).map((item) => (
              <div key={item._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.studentName} • {item.lecturerName || "General"} • {item.rating}/5
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleFeedbackStatusChange(item._id, "reviewed")}>Reviewed</button>
                  <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleFeedbackStatusChange(item._id, "shared_with_lecturer")}>Share</button>
                  <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleFeedbackStatusChange(item._id, "actioned")}>Actioned</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Add students" description="Add students by department, section, and semester so they appear in daily attendance taking.">
          <form className="grid gap-3" onSubmit={handleCreateStudent}>
            <InputField label="Student name" value={studentForm.name} onChange={(value) => setStudentForm({ ...studentForm, name: value })} />
            <InputField label="Email" type="email" value={studentForm.email} onChange={(value) => setStudentForm({ ...studentForm, email: value })} />
            <InputField label="College ID" value={studentForm.collegeId} onChange={(value) => setStudentForm({ ...studentForm, collegeId: value.toUpperCase() })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Department" value={studentForm.department} onChange={(value) => setStudentForm({ ...studentForm, department: value })} />
              <InputField label="Section" value={studentForm.section} onChange={(value) => setStudentForm({ ...studentForm, section: value.toUpperCase() })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Semester" type="number" value={studentForm.semester} onChange={(value) => setStudentForm({ ...studentForm, semester: Number(value) })} />
              <InputField label="Temporary password" type="password" value={studentForm.password} onChange={(value) => setStudentForm({ ...studentForm, password: value })} />
            </div>
            <button type="submit" className="primary-button justify-center">Add student</button>
          </form>
        </SectionCard>

        <SectionCard title="Lecturer and subject setup" description="Create lecturers and define what they teach so students can rate the right lecturer.">
          <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); submitRecord("faculty", "/faculty", { ...lecturerForm, employeeId: lecturerForm.employeeId.toUpperCase(), specialization: lecturerForm.specialization.split(",").map((item) => item.trim()).filter(Boolean), assignedSubjects: lecturerForm.assignedSubjectName ? [{ subjectName: lecturerForm.assignedSubjectName, courseCode: lecturerForm.assignedCourseCode.toUpperCase(), department: lecturerForm.department, semester: Number(lecturerForm.assignedSemester), section: lecturerForm.assignedSection.toUpperCase() }] : [] }, () => setLecturerForm(emptyLecturerForm)); }}>
            <InputField label="Lecturer name" value={lecturerForm.name} onChange={(value) => setLecturerForm({ ...lecturerForm, name: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Email" type="email" value={lecturerForm.email} onChange={(value) => setLecturerForm({ ...lecturerForm, email: value })} />
              <InputField label="Employee ID" value={lecturerForm.employeeId} onChange={(value) => setLecturerForm({ ...lecturerForm, employeeId: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Department" value={lecturerForm.department} onChange={(value) => setLecturerForm({ ...lecturerForm, department: value })} />
              <InputField label="Designation" value={lecturerForm.designation} onChange={(value) => setLecturerForm({ ...lecturerForm, designation: value })} />
            </div>
            <InputField label="Specializations" value={lecturerForm.specialization} onChange={(value) => setLecturerForm({ ...lecturerForm, specialization: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Subject name" value={lecturerForm.assignedSubjectName} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedSubjectName: value })} />
              <InputField label="Course code" value={lecturerForm.assignedCourseCode} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedCourseCode: value.toUpperCase() })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Semester" type="number" value={lecturerForm.assignedSemester} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedSemester: Number(value) })} />
              <InputField label="Section" value={lecturerForm.assignedSection} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedSection: value.toUpperCase() })} />
            </div>
            <button type="submit" className="primary-button justify-center">Add lecturer</button>
          </form>
        </SectionCard>

        <SectionCard title="Create holidays with full attendance" description="Create a holiday by department and section, then award full attendance automatically.">
          <form className="grid gap-3" onSubmit={handleCreateHoliday}>
            <InputField label="Holiday title" value={holidayForm.title} onChange={(value) => setHolidayForm({ ...holidayForm, title: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Date" type="date" value={holidayForm.date} onChange={(value) => setHolidayForm({ ...holidayForm, date: value })} />
              <InputField label="Department" value={holidayForm.department} onChange={(value) => setHolidayForm({ ...holidayForm, department: value })} />
            </div>
            <InputField label="Section" value={holidayForm.section} onChange={(value) => setHolidayForm({ ...holidayForm, section: value })} />
            <TextAreaField label="Reason / note" value={holidayForm.description} onChange={(value) => setHolidayForm({ ...holidayForm, description: value })} />
            <button type="submit" className="primary-button justify-center">Create holiday attendance</button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Recent students and holidays" description="Quick admin visibility into who was added and which holiday attendance rules are active.">
          <div className="space-y-3">
            {users.filter((user) => user.role === "student").slice(0, 5).map((user) => (
              <div key={user._id} className="list-row">
                <div>
                  <p className="font-semibold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.collegeId} • {user.department} • Section {user.section}</p>
                </div>
                <span className="pill">Student</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {holidays.slice(0, 4).map((holiday) => (
              <div key={holiday._id} className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="font-semibold text-slate-950">{holiday.title}</p>
                <p className="mt-1 text-sm text-slate-500">{new Date(holiday.date).toLocaleDateString()} • {holiday.department} • {holiday.section}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{holiday.description || "Full attendance applied."}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Complaint resolver queue" description="Students can raise complaints and the admin portal keeps them visible until resolved.">
          <div className="space-y-3">
            {issues.slice(0, 5).map((issue) => (
              <div key={issue._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-950">{issue.title}</p>
                <p className="mt-1 text-sm text-slate-500">{issue.studentName} • {issue.category} • {issue.priority}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{issue.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
