import { InputField, SectionCard, SelectField, TextAreaField } from "./PortalUI";

export function FeedbackSection({
  feedbackForm,
  setFeedbackForm,
  feedback,
  currentUser,
  submitRecord,
  emptyFeedbackForm,
  faculty,
}) {
  const lecturerOptions = faculty.map((item) => {
    const primarySubject = item.assignedSubjects?.[0];
    return {
      label: primarySubject ? `${item.name} - ${primarySubject.subjectName}` : item.name,
      value: item._id,
      lecturer: item,
    };
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <SectionCard
        title="Student feedback"
        description="Capture ratings and comments for lecturers, classes, and the platform so the admin team can review them properly."
      >
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const ratings = [feedbackForm.teachingRating, feedbackForm.labRating, feedbackForm.notesRating]
              .map((item) => Number(item))
              .filter((item) => Number.isFinite(item) && item > 0);
            submitRecord(
              "feedback",
              "/feedback",
              {
                ...feedbackForm,
                rating: ratings.length ? Number((ratings.reduce((sum, item) => sum + item, 0) / ratings.length).toFixed(1)) : feedbackForm.rating,
                studentId: currentUser?._id,
                studentName: currentUser?.name || "Guest Student",
                collegeId: currentUser?.collegeId || "NA",
                status: "new",
              },
              () => setFeedbackForm(emptyFeedbackForm)
            );
          }}
        >
          <InputField label="Feedback title" value={feedbackForm.title} onChange={(value) => setFeedbackForm({ ...feedbackForm, title: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Category"
              value={feedbackForm.category}
              onChange={(value) => setFeedbackForm({ ...feedbackForm, category: value })}
              options={[
                { label: "Teaching", value: "teaching" },
                { label: "Lab", value: "lab" },
                { label: "Notes", value: "notes" },
                { label: "Overall", value: "general" },
              ]}
            />
            <SelectField
              label="Feedback scope"
              value={feedbackForm.feedbackScope}
              onChange={(value) => setFeedbackForm({ ...feedbackForm, feedbackScope: value })}
              options={[
                { label: "Teaching", value: "teaching" },
                { label: "Lab", value: "lab" },
                { label: "Notes", value: "notes" },
                { label: "Overall", value: "overall" },
              ]}
            />
          </div>
          <SelectField
            label="Lecturer"
            value={feedbackForm.lecturerId}
            onChange={(value) => {
              const selected = lecturerOptions.find((item) => item.value === value)?.lecturer;
              const primarySubject = selected?.assignedSubjects?.[0] || {};
              setFeedbackForm({
                ...feedbackForm,
                lecturerId: value,
                lecturerName: selected?.name || "",
                subjectName: primarySubject.subjectName || "",
                department: primarySubject.department || selected?.department || currentUser?.department || "",
                section: primarySubject.section || currentUser?.section || "",
                semester: primarySubject.semester || currentUser?.semester || 1,
              });
            }}
            options={[
              { label: "General feedback", value: "" },
              ...lecturerOptions.map((item) => ({ label: item.label, value: item.value })),
            ]}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <InputField label="Teaching / 5" type="number" min="1" max="5" value={feedbackForm.teachingRating} onChange={(value) => setFeedbackForm({ ...feedbackForm, teachingRating: Number(value) })} />
            <InputField label="Lab / 5" type="number" min="1" max="5" value={feedbackForm.labRating} onChange={(value) => setFeedbackForm({ ...feedbackForm, labRating: Number(value) })} />
            <InputField label="Notes / 5" type="number" min="1" max="5" value={feedbackForm.notesRating} onChange={(value) => setFeedbackForm({ ...feedbackForm, notesRating: Number(value) })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <InputField label="Subject" value={feedbackForm.subjectName || ""} onChange={(value) => setFeedbackForm({ ...feedbackForm, subjectName: value })} />
            <InputField label="Department" value={feedbackForm.department || ""} onChange={(value) => setFeedbackForm({ ...feedbackForm, department: value })} />
            <InputField label="Section" value={feedbackForm.section || ""} onChange={(value) => setFeedbackForm({ ...feedbackForm, section: value.toUpperCase() })} />
          </div>
          <TextAreaField label="Message" value={feedbackForm.message} onChange={(value) => setFeedbackForm({ ...feedbackForm, message: value })} />
          <button type="submit" className="primary-button justify-center">Send feedback</button>
        </form>
      </SectionCard>

      <SectionCard title="Feedback board" description="Recent student sentiment, grouped with lecturer context for admin review.">
        <div className="space-y-3">
          {feedback.slice(0, 8).map((item) => (
            <div key={item._id} className="list-row">
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.studentName} - {item.category}
                  {item.lecturerName ? ` - ${item.lecturerName}` : ""}
                  {item.subjectName ? ` - ${item.subjectName}` : ""}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
              </div>
              <div className="text-right">
                <span className="pill pill-success">{item.rating}/5</span>
                <p className="mt-2 text-xs text-slate-500">Teach {item.teachingRating || "-"} | Lab {item.labRating || "-"} | Notes {item.notesRating || "-"}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
