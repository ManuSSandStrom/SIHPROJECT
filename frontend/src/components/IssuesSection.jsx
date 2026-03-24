import { InputField, SectionCard, SelectField, TextAreaField } from "./PortalUI";

export function IssuesSection({ issueForm, setIssueForm, issues, currentUser, submitRecord, isAdmin, handleIssueStatusChange, emptyIssueForm }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <SectionCard title="Issue management" description="Students can raise attendance, timetable, academic, or facility issues and admins can track each case.">
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); submitRecord("issues", "/issues", { ...issueForm, studentId: currentUser?._id, studentName: currentUser?.name || "Guest Student", collegeId: currentUser?.collegeId || "NA", status: "open" }, () => setIssueForm(emptyIssueForm)); }}>
          <InputField label="Issue title" value={issueForm.title} onChange={(value) => setIssueForm({ ...issueForm, title: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField label="Category" value={issueForm.category} onChange={(value) => setIssueForm({ ...issueForm, category: value })} options={[{ label: "Academic", value: "academic" }, { label: "Attendance", value: "attendance" }, { label: "Timetable", value: "timetable" }, { label: "Facilities", value: "facilities" }, { label: "Technical", value: "technical" }, { label: "Other", value: "other" }]} />
            <SelectField label="Priority" value={issueForm.priority} onChange={(value) => setIssueForm({ ...issueForm, priority: value })} options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }, { label: "Critical", value: "critical" }]} />
          </div>
          <TextAreaField label="Description" value={issueForm.description} onChange={(value) => setIssueForm({ ...issueForm, description: value })} />
          <button type="submit" className="primary-button justify-center">Submit issue</button>
        </form>
      </SectionCard>

      <SectionCard title="Issue tracker" description="Visible queue with fast admin resolution actions.">
        <div className="space-y-3">
          {issues.slice(0, 8).map((issue) => (
            <div key={issue._id} className="list-row items-start">
              <div>
                <p className="font-semibold text-slate-950">{issue.title}</p>
                <p className="mt-1 text-sm text-slate-500">{issue.studentName} • {issue.category} • {issue.priority}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{issue.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="pill">{issue.status}</span>
                {isAdmin ? <button type="button" className="secondary-button px-3 py-2 text-sm" onClick={() => handleIssueStatusChange(issue._id, issue.status === "resolved" ? "closed" : "resolved")}>{issue.status === "resolved" ? "Close" : "Resolve"}</button> : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
