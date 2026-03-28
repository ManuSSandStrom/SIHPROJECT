export function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(239,246,255,0.95)_100%)] px-6 py-10 text-center">
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
