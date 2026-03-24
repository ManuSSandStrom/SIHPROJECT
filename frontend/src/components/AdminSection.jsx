import { MiniPanel, SectionCard, InputField, SelectField, TextAreaField } from "./PortalUI";

const roomTypeOptions = [
  { label: "Lecture hall", value: "lecture_hall" },
  { label: "Lab", value: "lab" },
  { label: "Seminar room", value: "seminar_room" },
  { label: "Auditorium", value: "auditorium" },
];

export function AdminSection({
  lecturerForm,
  setLecturerForm,
  studentForm,
  setStudentForm,
  holidayForm,
  setHolidayForm,
  courseForm,
  setCourseForm,
  roomForm,
  setRoomForm,
  faculty,
  users,
  courses,
  rooms,
  issues,
  feedback,
  holidays,
  attendance,
  contactMessages,
  dashboard,
  handleCreateStudent,
  handleCreateHoliday,
  submitRecord,
  emptyLecturerForm,
  emptyCourseForm,
  emptyRoomForm,
  handleFeedbackStatusChange,
  handleIssueStatusChange,
  handleContactStatusChange,
  handleUserStatusChange,
}) {
  const studentCount = users.filter((user) => user.role === "student").length;
  const lecturerCount = users.filter((user) => user.role === "lecturer" && user.status === "active").length;
  const pendingLecturers = users.filter((user) => user.role === "lecturer" && user.status === "pending");
  const presentCount = attendance.filter((item) => item.status === "present").length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniPanel title="Students" value={studentCount} subtitle="Roster by department and section" />
        <MiniPanel title="Lecturers" value={lecturerCount || faculty.length} subtitle="Approved staff with teaching responsibilities" />
        <MiniPanel title="Attendance rate" value={`${attendanceRate}%`} subtitle="Daily attendance performance" />
        <MiniPanel title="Pending approvals" value={dashboard?.kpis?.pendingLecturerApprovals || pendingLecturers.length} subtitle="Lecturer signup requests waiting for admin action" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Add student" description="Create student accounts by department, semester, and section so attendance can be taken daily.">
          <form className="grid gap-3" onSubmit={handleCreateStudent}>
            <InputField label="Student name" value={studentForm.name} onChange={(value) => setStudentForm({ ...studentForm, name: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="College ID" value={studentForm.collegeId} onChange={(value) => setStudentForm({ ...studentForm, collegeId: value.toUpperCase() })} />
              <InputField label="Email" type="email" value={studentForm.email} onChange={(value) => setStudentForm({ ...studentForm, email: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Roll number" value={studentForm.rollNumber || ""} onChange={(value) => setStudentForm({ ...studentForm, rollNumber: value.toUpperCase() })} />
              <InputField label="Department" value={studentForm.department} onChange={(value) => setStudentForm({ ...studentForm, department: value })} />
              <InputField label="Semester" type="number" value={studentForm.semester} onChange={(value) => setStudentForm({ ...studentForm, semester: Number(value) })} />
            </div>
            <InputField label="Section" value={studentForm.section} onChange={(value) => setStudentForm({ ...studentForm, section: value.toUpperCase() })} />
            <InputField label="Phone" value={studentForm.phone || ""} onChange={(value) => setStudentForm({ ...studentForm, phone: value })} />
            <button type="submit" className="primary-button justify-center">Add student</button>
          </form>
        </SectionCard>

        <SectionCard title="Add lecturer" description="Register lecturers and connect them to the subjects they teach for timetables and feedback.">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitRecord(
                "faculty",
                "/faculty",
                {
                  ...lecturerForm,
                  employeeId: lecturerForm.employeeId.toUpperCase(),
                  specialization: lecturerForm.specialization
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  maxHoursPerWeek: Number(lecturerForm.maxHoursPerWeek || 18),
                  assignedSubjects: [
                    {
                      subjectName: lecturerForm.assignedSubjectName,
                      courseCode: lecturerForm.assignedCourseCode.toUpperCase(),
                      department: lecturerForm.department,
                      semester: Number(lecturerForm.assignedSemester),
                      section: lecturerForm.assignedSection.toUpperCase(),
                    },
                  ],
                },
                () => setLecturerForm(emptyLecturerForm)
              );
            }}
          >
            <InputField label="Lecturer name" value={lecturerForm.name} onChange={(value) => setLecturerForm({ ...lecturerForm, name: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Employee ID" value={lecturerForm.employeeId} onChange={(value) => setLecturerForm({ ...lecturerForm, employeeId: value })} />
              <InputField label="Email" type="email" value={lecturerForm.email} onChange={(value) => setLecturerForm({ ...lecturerForm, email: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Department" value={lecturerForm.department} onChange={(value) => setLecturerForm({ ...lecturerForm, department: value })} />
              <InputField label="Designation" value={lecturerForm.designation} onChange={(value) => setLecturerForm({ ...lecturerForm, designation: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Phone" value={lecturerForm.phone} onChange={(value) => setLecturerForm({ ...lecturerForm, phone: value })} />
              <InputField label="Office location" value={lecturerForm.officeLocation} onChange={(value) => setLecturerForm({ ...lecturerForm, officeLocation: value })} />
            </div>
            <InputField label="Specialization" value={lecturerForm.specialization} onChange={(value) => setLecturerForm({ ...lecturerForm, specialization: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Subject name" value={lecturerForm.assignedSubjectName} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedSubjectName: value })} />
              <InputField label="Course code" value={lecturerForm.assignedCourseCode} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedCourseCode: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Teaching semester" type="number" value={lecturerForm.assignedSemester} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedSemester: Number(value) })} />
              <InputField label="Section" value={lecturerForm.assignedSection} onChange={(value) => setLecturerForm({ ...lecturerForm, assignedSection: value })} />
              <InputField label="Hours per week" type="number" value={lecturerForm.maxHoursPerWeek || 18} onChange={(value) => setLecturerForm({ ...lecturerForm, maxHoursPerWeek: Number(value) })} />
            </div>
            <button type="submit" className="primary-button justify-center">Add lecturer</button>
          </form>
        </SectionCard>

        <SectionCard title="Holiday attendance" description="Declare holidays and automatically mark full attendance for selected sections or departments.">
          <form className="grid gap-3" onSubmit={handleCreateHoliday}>
            <InputField label="Holiday title" value={holidayForm.title} onChange={(value) => setHolidayForm({ ...holidayForm, title: value })} />
            <TextAreaField label="Description" value={holidayForm.description} onChange={(value) => setHolidayForm({ ...holidayForm, description: value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Date" type="date" value={holidayForm.date} onChange={(value) => setHolidayForm({ ...holidayForm, date: value })} />
              <InputField label="Department" value={holidayForm.department} onChange={(value) => setHolidayForm({ ...holidayForm, department: value })} />
            </div>
            <InputField label="Section" value={holidayForm.section} onChange={(value) => setHolidayForm({ ...holidayForm, section: value })} />
            <button type="submit" className="primary-button justify-center">Create holiday rule</button>
          </form>
          <div className="mt-5 space-y-3">
            {holidays.slice(0, 4).map((holiday) => (
              <div key={holiday._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-950">{holiday.title}</p>
                <p className="mt-1 text-sm text-slate-500">{new Date(holiday.date).toLocaleDateString()} - {holiday.department} - Section {holiday.section}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Lecturer approval queue" description="Lecturer signups stay pending until admin approves them for portal access and attendance marking.">
          <div className="space-y-3">
            {pendingLecturers.length === 0 ? (
              <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-600">
                No lecturer approvals are waiting right now.
              </div>
            ) : (
              pendingLecturers.map((lecturer) => (
                <div key={lecturer._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{lecturer.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {lecturer.staffId} - {lecturer.department || "Department pending"} - {lecturer.qualification || "Qualification not provided"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{lecturer.email} - {lecturer.phone || "No phone number"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="primary-button px-4 py-2" onClick={() => handleUserStatusChange(lecturer._id, "active")}>Approve lecturer</button>
                      <button type="button" className="secondary-button px-4 py-2" onClick={() => handleUserStatusChange(lecturer._id, "inactive")}>Decline</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Course setup" description="Create department subjects so the timetable scheduler can assign hours, rooms, and lecturers correctly.">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitRecord(
                "courses",
                "/courses",
                {
                  ...courseForm,
                  code: courseForm.code.toUpperCase(),
                  credits: Number(courseForm.credits),
                  semester: Number(courseForm.semester),
                  year: Number(courseForm.year),
                  duration: Number(courseForm.duration),
                  hoursPerWeek: Number(courseForm.hoursPerWeek),
                  prerequisites: courseForm.prerequisites
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                },
                () => setCourseForm(emptyCourseForm)
              );
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Course name" value={courseForm.name} onChange={(value) => setCourseForm({ ...courseForm, name: value })} />
              <InputField label="Course code" value={courseForm.code} onChange={(value) => setCourseForm({ ...courseForm, code: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Department" value={courseForm.department} onChange={(value) => setCourseForm({ ...courseForm, department: value })} />
              <InputField label="Semester" type="number" value={courseForm.semester} onChange={(value) => setCourseForm({ ...courseForm, semester: Number(value) })} />
              <InputField label="Credits" type="number" value={courseForm.credits} onChange={(value) => setCourseForm({ ...courseForm, credits: Number(value) })} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Academic year" type="number" value={courseForm.year} onChange={(value) => setCourseForm({ ...courseForm, year: Number(value) })} />
              <InputField label="Duration weeks" type="number" value={courseForm.duration} onChange={(value) => setCourseForm({ ...courseForm, duration: Number(value) })} />
              <InputField label="Hours per week" type="number" value={courseForm.hoursPerWeek} onChange={(value) => setCourseForm({ ...courseForm, hoursPerWeek: Number(value) })} />
            </div>
            <SelectField label="Type" value={courseForm.type} onChange={(value) => setCourseForm({ ...courseForm, type: value })} options={[{ label: "Lecture", value: "lecture" }, { label: "Lab", value: "lab" }, { label: "Seminar", value: "seminar" }]} />
            <TextAreaField label="Description" value={courseForm.description} onChange={(value) => setCourseForm({ ...courseForm, description: value })} />
            <InputField label="Prerequisites" value={courseForm.prerequisites} onChange={(value) => setCourseForm({ ...courseForm, prerequisites: value })} />
            <button type="submit" className="primary-button justify-center">Add course</button>
          </form>
          <div className="mt-5 grid gap-3">
            {courses.slice(0, 4).map((course) => (
              <div key={course._id} className="list-row">
                <div>
                  <p className="font-semibold text-slate-950">{course.name}</p>
                  <p className="text-sm text-slate-500">{course.code} - Semester {course.semester} - {course.department}</p>
                </div>
                <span className="pill">{course.type}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Room and classroom setup" description="Define rooms, capacity, and space type before generating professional timetables.">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitRecord(
                "rooms",
                "/rooms",
                {
                  ...roomForm,
                  floor: Number(roomForm.floor),
                  capacity: Number(roomForm.capacity),
                  equipment: roomForm.equipment
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                },
                () => setRoomForm(emptyRoomForm)
              );
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Room name" value={roomForm.name} onChange={(value) => setRoomForm({ ...roomForm, name: value })} />
              <InputField label="Building" value={roomForm.building} onChange={(value) => setRoomForm({ ...roomForm, building: value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InputField label="Floor" type="number" value={roomForm.floor} onChange={(value) => setRoomForm({ ...roomForm, floor: Number(value) })} />
              <InputField label="Capacity" type="number" value={roomForm.capacity} onChange={(value) => setRoomForm({ ...roomForm, capacity: Number(value) })} />
              <SelectField label="Type" value={roomForm.type} onChange={(value) => setRoomForm({ ...roomForm, type: value })} options={roomTypeOptions} />
            </div>
            <InputField label="Equipment" value={roomForm.equipment} onChange={(value) => setRoomForm({ ...roomForm, equipment: value })} />
            <button type="submit" className="primary-button justify-center">Add room</button>
          </form>
          <div className="mt-5 grid gap-3">
            {rooms.slice(0, 4).map((room) => (
              <div key={room._id} className="list-row">
                <div>
                  <p className="font-semibold text-slate-950">{room.name}</p>
                  <p className="text-sm text-slate-500">{room.building} - Floor {room.floor} - Capacity {room.capacity}</p>
                </div>
                <span className="pill">{room.type}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Contact and support inbox" description="Messages from the contact page land here for review and response.">
          <div className="space-y-3">
            {contactMessages.slice(0, 6).map((item) => (
              <div key={item._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name || item.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.email} - {item.phone} - {item.collegeId || "No college ID"}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.message}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className="pill">{item.status}</span>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleContactStatusChange(item._id, "in_review")}>Review</button>
                      <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleContactStatusChange(item._id, "resolved")}>Resolve</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Complaints and feedback control" description="Monitor student issues and lecturer feedback from a single admin page.">
          <div className="space-y-5">
            <div className="space-y-3">
              {issues.slice(0, 3).map((issue) => (
                <div key={issue._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-950">{issue.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{issue.studentName} - {issue.category} - {issue.priority}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{issue.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="pill">{issue.status}</span>
                    <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleIssueStatusChange(issue._id, "received")}>Received</button>
                    <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleIssueStatusChange(issue._id, "contacted")}>Contacted</button>
                    <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleIssueStatusChange(issue._id, "solved")}>Solved</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {feedback.slice(0, 3).map((item) => (
                <div key={item._id} className="rounded-3xl border border-sky-100 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.studentName} - {item.lecturerName || "General"} - {item.subjectName || "Subject pending"} - Rating {item.rating}/5</p>
                  <p className="mt-1 text-xs text-slate-500">Teaching {item.teachingRating || "-"} | Lab {item.labRating || "-"} | Notes {item.notesRating || "-"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleFeedbackStatusChange(item._id, "reviewed")}>Mark reviewed</button>
                    <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleFeedbackStatusChange(item._id, "shared_with_lecturer")}>Share with lecturer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
