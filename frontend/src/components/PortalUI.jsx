export function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-sky-700">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_25px_70px_rgba(14,116,255,0.08)]">
      <div className="mb-5">
        <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        <Icon size={20} />
      </div>
      <h4 className="mt-4 text-lg font-semibold text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function MiniPanel({ title, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export function InputField({ label, onChange, ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input className="field-input" onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextAreaField({ label, value, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <textarea className="field-input min-h-28 resize-none" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
