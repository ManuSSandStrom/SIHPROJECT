import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable } from "../components/data/DataTable";
import { PageHeader } from "../components/common/PageHeader";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { FormField } from "../components/forms/FormField";
import { Badge } from "../components/common/Badge";
import { TrendChart } from "../components/charts/TrendChart";
import { api, unwrap } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/formatters";
import { useApiState } from "../hooks/useApiState";

export function IssuesWorkspacePage({ role }) {
  const isAdmin = role === "admin";
  const [refreshKey, setRefreshKey] = useState(0);
  const issues = useApiState(() => unwrap(api.get("/issues")), `issues-${role}-${refreshKey}`);
  const createForm = useForm({ defaultValues: { category: "attendance_issue", title: "", description: "", priority: "medium", confidential: false, attachmentUrl: "" } });
  const replyForm = useForm({ defaultValues: { message: "" } });
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    if (issues.data?.length && !selectedIssue) {
      setSelectedIssue(issues.data[0]);
    }
  }, [issues.data, selectedIssue]);

  async function submitIssue(values) {
    await unwrap(api.post("/issues", values));
    createForm.reset();
    setRefreshKey((value) => value + 1);
  }

  async function updateIssue(status) {
    if (!selectedIssue) return;
    await unwrap(api.patch(`/issues/${selectedIssue._id}`, { status }));
    setRefreshKey((value) => value + 1);
  }

  async function reply(values) {
    if (!selectedIssue) return;
    await unwrap(api.post(`/issues/${selectedIssue._id}/replies`, values));
    replyForm.reset();
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Issue Desk" title={isAdmin ? "Resolve student complaints securely" : "Raise secure academic and campus issues"} description={isAdmin ? "Filter, inspect, reply to, and move tickets through the workflow pipeline." : "Submit attendance, timetable, faculty, technical, or grievance issues privately."} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {!isAdmin ? (
          <Card>
            <CardHeader title="Raise an Issue" description="Only you and admin can view your issue thread." />
            <CardBody>
              <form className="grid gap-4" onSubmit={createForm.handleSubmit(submitIssue)}>
                <FormField label="Category" as="select" options={[
                  { value: "attendance_issue", label: "Attendance Issue" },
                  { value: "timetable_issue", label: "Timetable Issue" },
                  { value: "faculty_issue", label: "Faculty Issue" },
                  { value: "academic_issue", label: "Academic Issue" },
                  { value: "lab_issue", label: "Lab Issue" },
                  { value: "infrastructure_issue", label: "Infrastructure Issue" },
                  { value: "technical_issue", label: "Technical Issue" },
                  { value: "grievance_personal_issue", label: "Grievance / Personal Issue" },
                  { value: "other", label: "Other" },
                ]} {...createForm.register("category")} />
                <FormField label="Title" {...createForm.register("title")} />
                <FormField label="Priority" as="select" options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "critical", label: "Critical" }]} {...createForm.register("priority")} />
                <FormField label="Attachment URL (optional)" {...createForm.register("attachmentUrl")} />
                <FormField label="Description" as="textarea" {...createForm.register("description")} />
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" {...createForm.register("confidential")} />
                  Mark as confidential
                </label>
                <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Submit Issue</button>
              </form>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Issue Queue" description="Review the current issue pipeline." />
            <CardBody className="space-y-3">
              {(issues.data || []).map((issue) => (
                <button key={issue._id} type="button" className={`w-full rounded-[22px] border px-4 py-4 text-left ${selectedIssue?._id === issue._id ? "border-sky-500 bg-sky-50" : "border-sky-100 bg-white"}`} onClick={() => setSelectedIssue(issue)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{issue.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{issue.student?.user?.fullName || "Student"}</p>
                    </div>
                    <Badge tone={issue.status === "solved" ? "success" : "warning"}>{issue.status}</Badge>
                  </div>
                </button>
              ))}
            </CardBody>
          </Card>
        )}
        <Card>
          <CardHeader title={isAdmin ? "Issue Detail" : "My Issue History"} description={isAdmin ? "Update issue status and reply to the selected ticket." : "Track status and admin response on your issues."} />
          <CardBody className="space-y-5">
            {isAdmin ? (
              selectedIssue ? (
                <>
                  <div className="rounded-[22px] border border-sky-100 bg-slate-50/80 p-4">
                    <h3 className="text-lg font-semibold text-slate-950">{selectedIssue.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{selectedIssue.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-800" onClick={() => updateIssue("under_review")}>Under Review</button>
                      <button type="button" className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-800" onClick={() => updateIssue("in_progress")}>In Progress</button>
                      <button type="button" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => updateIssue("solved")}>Solved</button>
                    </div>
                  </div>
                  <form className="grid gap-4" onSubmit={replyForm.handleSubmit(reply)}>
                    <FormField label="Reply" as="textarea" {...replyForm.register("message")} />
                    <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Send Reply</button>
                  </form>
                </>
              ) : (
                <EmptyState title="No issue selected" description="Choose an issue from the queue to inspect it." />
              )
            ) : (
              <div className="space-y-3">
                {(issues.data || []).map((issue) => (
                  <div key={issue._id} className="rounded-[22px] border border-sky-100 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{issue.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{issue.category}</p>
                      </div>
                      <Badge tone={issue.status === "solved" ? "success" : "warning"}>{issue.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{issue.description}</p>
                  </div>
                ))}
                {!issues.data?.length ? <EmptyState title="No issues yet" description="Create your first issue if you need admin support." /> : null}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function FeedbackWorkspacePage({ role }) {
  const isAdmin = role === "admin";
  const isFaculty = role === "faculty";
  const isStudent = role === "student";
  const analytics = useApiState(
    () => (isAdmin ? unwrap(api.get("/feedback/analytics")) : Promise.resolve(null)),
    `feedback-analytics-${role}`,
  );
  const cycles = useApiState(() => unwrap(api.get("/feedback/cycles?active=true")), `feedback-cycles-${role}`);
  const targets = useApiState(() => (isStudent ? unwrap(api.get("/feedback/eligible-faculty")) : Promise.resolve([])), `feedback-targets-${role}`);
  const submissions = useApiState(() => ((isAdmin || isFaculty) ? unwrap(api.get("/feedback/submissions")) : Promise.resolve([])), `feedback-submissions-${role}`);
  const templateForm = useForm({
    defaultValues: {
      name: "Custom Teaching Template",
      description: "Structured lecturer evaluation template",
      questions: JSON.stringify([{ key: "teaching_quality", label: "Teaching quality", category: "teaching_quality", type: "rating", maxScore: 5 }], null, 2),
    },
  });
  const feedbackForm = useForm({
    defaultValues: {
      cycleId: "",
      facultyId: "",
      subjectId: "",
      teaching: 5,
      clarity: 5,
      punctuality: 5,
      communication: 5,
      strengths: "",
      areasToImprove: "",
      additionalComments: "",
      isAnonymous: true,
    },
  });

  useEffect(() => {
    if (targets.data?.length) {
      feedbackForm.setValue("facultyId", targets.data[0].facultyId);
      feedbackForm.setValue("subjectId", targets.data[0].subjectId);
    }
    if (cycles.data?.length) {
      feedbackForm.setValue("cycleId", cycles.data[0]._id);
    }
  }, [cycles.data, feedbackForm, targets.data]);

  async function createTemplate(values) {
    await unwrap(api.post("/feedback/templates", { name: values.name, description: values.description, questions: JSON.parse(values.questions) }));
  }

  async function submitStudentFeedback(values) {
    await unwrap(
      api.post("/feedback/submit", {
        cycleId: values.cycleId,
        facultyId: values.facultyId,
        subjectId: values.subjectId,
        responses: [
          { key: "teaching_quality", label: "Teaching quality", category: "teaching_quality", score: Number(values.teaching) },
          { key: "clarity_of_explanation", label: "Clarity of explanation", category: "clarity_of_explanation", score: Number(values.clarity) },
          { key: "punctuality", label: "Punctuality", category: "punctuality", score: Number(values.punctuality) },
          { key: "communication_skills", label: "Communication skills", category: "communication_skills", score: Number(values.communication) },
        ],
        strengths: values.strengths,
        areasToImprove: values.areasToImprove,
        additionalComments: values.additionalComments,
        isAnonymous: values.isAnonymous,
      }),
    );
  }

  if (isFaculty) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Faculty Feedback" title="View submitted lecturer feedback responses" description="Review aggregated submissions routed to your faculty profile." />
        <DataTable
          title="Feedback Submissions"
          description="Responses submitted in active or historic cycles."
          data={submissions.data || []}
          columns={[
            { header: "Cycle", accessorFn: (row) => row.cycle?.title, cell: (info) => info.getValue() },
            { header: "Subject", accessorFn: (row) => row.subject?.name, cell: (info) => info.getValue() },
            { header: "Average Rating", accessorFn: (row) => row.averageRating, cell: (info) => `${info.getValue()}/5` },
            { header: "Date", accessorFn: (row) => formatDate(row.createdAt), cell: (info) => info.getValue() },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Lecturer Feedback" title={isAdmin ? "Template, cycle, and analytics management" : "Submit structured lecturer feedback"} description={isAdmin ? "Monitor lecturer performance trends, template design, and cycle activity." : "You can submit only one feedback response per lecturer per active cycle."} />
      {isAdmin ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader title="Create Feedback Template" description="Define structured question sets for lecturer evaluation." />
            <CardBody>
              <form className="grid gap-4" onSubmit={templateForm.handleSubmit(createTemplate)}>
                <FormField label="Template Name" {...templateForm.register("name")} />
                <FormField label="Description" {...templateForm.register("description")} />
                <FormField label="Questions JSON" as="textarea" {...templateForm.register("questions")} />
                <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Create Template</button>
              </form>
            </CardBody>
          </Card>
          <div className="space-y-6">
            <TrendChart title="Faculty Rating Overview" description="Average lecturer ratings across current filters." data={analytics.data?.facultySummary || []} dataKey="averageRating" labelKey="facultyName" variant="bar" />
            <DataTable
              title="Feedback Submissions"
              description="Submission-level feedback records."
              data={analytics.data?.submissions || []}
              columns={[
                { header: "Faculty", accessorFn: (row) => row.faculty?.user?.fullName, cell: (info) => info.getValue() },
                { header: "Subject", accessorFn: (row) => row.subject?.name, cell: (info) => info.getValue() },
                { header: "Rating", accessorFn: (row) => row.averageRating, cell: (info) => `${info.getValue()}/5` },
              ]}
            />
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader title="Submit Feedback" description="Rate lecturers assigned to your section and add qualitative comments." />
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={feedbackForm.handleSubmit(submitStudentFeedback)}>
              <FormField label="Cycle" as="select" options={(cycles.data || []).map((cycle) => ({ value: cycle._id, label: cycle.title }))} {...feedbackForm.register("cycleId")} />
              <FormField label="Faculty" as="select" options={(targets.data || []).map((target) => ({ value: target.facultyId, label: `${target.facultyName} - ${target.subjectCode}` }))} {...feedbackForm.register("facultyId")} />
              <FormField label="Subject" as="select" options={(targets.data || []).map((target) => ({ value: target.subjectId, label: target.subjectName }))} {...feedbackForm.register("subjectId")} />
              <FormField label="Teaching Quality" as="select" options={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value}/5` }))} {...feedbackForm.register("teaching")} />
              <FormField label="Clarity" as="select" options={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value}/5` }))} {...feedbackForm.register("clarity")} />
              <FormField label="Punctuality" as="select" options={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value}/5` }))} {...feedbackForm.register("punctuality")} />
              <FormField label="Communication" as="select" options={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value}/5` }))} {...feedbackForm.register("communication")} />
              <div className="md:col-span-2">
                <FormField label="Strengths" as="textarea" {...feedbackForm.register("strengths")} />
              </div>
              <div className="md:col-span-2">
                <FormField label="Areas to Improve" as="textarea" {...feedbackForm.register("areasToImprove")} />
              </div>
              <div className="md:col-span-2">
                <FormField label="Additional Comments" as="textarea" {...feedbackForm.register("additionalComments")} />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input type="checkbox" id="isAnonymous" {...feedbackForm.register("isAnonymous")} />
                <label htmlFor="isAnonymous" className="text-sm text-slate-700">Keep this feedback anonymous in reports</label>
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Submit Feedback</button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { data } = useApiState(() => unwrap(api.get("/notifications")), "notifications");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Notifications" title="Campus notifications and workflow alerts" description="Unread operational updates, approvals, and module-level activity all land here." />
      <div className="grid gap-4">
        {(data || []).map((item) => (
          <Card key={item._id}>
            <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{formatDate(item.createdAt, "dd MMM yyyy, hh:mm a")}</p>
              </div>
              <button type="button" className="rounded-2xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-800" onClick={() => unwrap(api.post(`/notifications/${item._id}/read`))}>
                Mark Read
              </button>
            </CardBody>
          </Card>
        ))}
        {!data?.length ? <EmptyState title="No notifications" description="You are all caught up for now." /> : null}
      </div>
    </div>
  );
}

export function ContactInboxPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const contacts = useApiState(
    () => unwrap(api.get("/admin/contacts")),
    `admin-contacts-${refreshKey}`,
  );

  useEffect(() => {
    if (contacts.data?.items?.length && !selectedMessage) {
      setSelectedMessage(contacts.data.items[0]);
    }
  }, [contacts.data?.items, selectedMessage]);

  async function updateStatus(status) {
    if (!selectedMessage) {
      return;
    }

    await unwrap(api.patch(`/admin/contacts/${selectedMessage._id}`, { status }));
    setRefreshKey((value) => value + 1);
    setSelectedMessage((current) => (current ? { ...current, status } : current));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contact Inbox"
        title="Review public Contact / Help submissions"
        description="Every message sent from the public help form lands here for admin follow-up. You can inspect the sender details and move the message through inbox statuses."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Inbox Queue" description="Messages submitted from the public contact form." />
          <CardBody className="space-y-3">
            {(contacts.data?.items || []).map((item) => (
              <button
                key={item._id}
                type="button"
                className={`w-full rounded-[22px] border px-4 py-4 text-left ${
                  selectedMessage?._id === item._id
                    ? "border-sky-500 bg-sky-50"
                    : "border-sky-100 bg-white"
                }`}
                onClick={() => setSelectedMessage(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                  </div>
                  <Badge
                    tone={
                      item.status === "resolved"
                        ? "success"
                        : item.status === "in_progress"
                          ? "warning"
                          : "info"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                  {item.message}
                </p>
              </button>
            ))}
            {!contacts.data?.items?.length ? (
              <EmptyState
                title="No contact messages yet"
                description="When someone submits the public Contact / Help form, the message will appear here."
              />
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Message Detail"
            description="Review sender information, message content, and update the current handling status."
          />
          <CardBody className="space-y-5">
            {selectedMessage ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Full Name</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{selectedMessage.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">College ID</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{selectedMessage.collegeId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</p>
                    <p className="mt-2"><Badge tone="neutral">{selectedMessage.category}</Badge></p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Status</p>
                    <p className="mt-2">
                      <Badge
                        tone={
                          selectedMessage.status === "resolved"
                            ? "success"
                            : selectedMessage.status === "in_progress"
                              ? "warning"
                              : "info"
                        }
                      >
                        {selectedMessage.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-sky-100 bg-slate-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Message</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{selectedMessage.message}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-800"
                    onClick={() => updateStatus("new")}
                  >
                    Mark New
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800"
                    onClick={() => updateStatus("in_progress")}
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => updateStatus("resolved")}
                  >
                    Mark Resolved
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                title="No message selected"
                description="Choose a contact message from the inbox to inspect it."
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Profile" title="Account and role details" description="Your current role, status, and workspace profile data." />
      <Card>
        <CardBody className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex h-40 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#e0ecff_0%,#bfdbfe_100%)] text-5xl font-semibold text-sky-800">
            {user?.fullName?.slice(0, 1)}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Full Name</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{user?.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</p>
              <p className="mt-2"><Badge>{user?.role}</Badge></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-2"><Badge tone={user?.status === "active" ? "success" : "warning"}>{user?.status}</Badge></p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
