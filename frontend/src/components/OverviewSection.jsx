import {
  AlertCircle,
  CalendarDays,
  ClipboardCheck,
  MessageSquareQuote,
} from "lucide-react";
import { FeatureCard, SectionCard } from "./PortalUI";

export function OverviewSection({ portalData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="Operational highlights"
        description="Designed around the common questions students and admins need answered quickly."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon={CalendarDays}
            title="Useful weekly timetable"
            description="Shows Monday to Saturday teaching clearly and keeps Sunday available for optional special classes."
          />
          <FeatureCard
            icon={ClipboardCheck}
            title="Attendance workflow"
            description="Lets staff record session status quickly without leaving the same workspace."
          />
          <FeatureCard
            icon={AlertCircle}
            title="Issue tracking"
            description="Students can submit academic or technical problems and admins can resolve them transparently."
          />
          <FeatureCard
            icon={MessageSquareQuote}
            title="Feedback loop"
            description="Collects student feedback in the product instead of losing it across different channels."
          />
        </div>
      </SectionCard>

      <SectionCard title="Recent activity" description="Latest notifications and planner updates for day-to-day monitoring.">
        <div className="space-y-3">
          {portalData.notifications.slice(0, 6).map((notification) => (
            <div key={notification._id} className="list-row">
              <div>
                <p className="font-semibold text-slate-950">{notification.title}</p>
                <p className="text-sm text-slate-500">{notification.message}</p>
              </div>
              <span className="pill">{notification.type}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
