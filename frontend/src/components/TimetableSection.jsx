import { InputField, SectionCard } from "./PortalUI";

export function TimetableSection({ timetable, timetableForm, setTimetableForm, handleTimetableGenerate, days }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <SectionCard title="Generate timetable" description="Create a full Monday-Saturday academic timetable and optionally include Sunday special sessions.">
        <form className="grid gap-3" onSubmit={handleTimetableGenerate}>
          <InputField label="Department" value={timetableForm.department} onChange={(value) => setTimetableForm({ ...timetableForm, department: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Semester" type="number" value={timetableForm.semester} onChange={(value) => setTimetableForm({ ...timetableForm, semester: value })} />
            <InputField label="Academic year" type="number" value={timetableForm.academicYear} onChange={(value) => setTimetableForm({ ...timetableForm, academicYear: value })} />
          </div>
          <label className="toggle-card">
            <input type="checkbox" checked={timetableForm.includeSundaySpecialClass} onChange={(event) => setTimetableForm({ ...timetableForm, includeSundaySpecialClass: event.target.checked })} />
            <span>Include Sunday special class option</span>
          </label>
          <button type="submit" className="primary-button justify-center">Generate schedule</button>
        </form>
      </SectionCard>

      <SectionCard title={timetable?.name || "Weekly timetable"} description="Designed for quick scanning on mobile and wide-screen admin review.">
        <div className="overflow-x-auto">
          <div className="grid min-w-[860px] grid-cols-7 gap-3">
            {days.map((day) => (
              <div key={day} className="rounded-3xl border border-sky-100 bg-sky-50/60 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">{day}</h4>
                  {day === "Sunday" ? <span className="pill">Special</span> : null}
                </div>
                <div className="space-y-3">
                  {(timetable?.schedule || []).filter((entry) => entry.day === day).map((entry, index) => (
                    <div key={`${day}-${index}`} className="slot-card">
                      <p className="text-sm font-semibold text-slate-950">{entry.courseName}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.timeSlot}</p>
                      <p className="mt-2 text-xs text-slate-600">{entry.facultyName}</p>
                      <p className="text-xs text-slate-500">{entry.roomName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
