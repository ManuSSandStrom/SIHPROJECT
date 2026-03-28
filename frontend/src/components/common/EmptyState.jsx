export function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/60 px-6 py-10 text-center">
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
