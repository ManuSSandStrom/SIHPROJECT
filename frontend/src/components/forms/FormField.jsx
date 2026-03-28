export function FormField({
  label,
  error,
  as = "input",
  className = "",
  options = [],
  ...props
}) {
  const shared =
    "w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100";

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {as === "textarea" ? (
        <textarea className={`${shared} min-h-[120px] resize-y ${className}`} {...props} />
      ) : as === "select" ? (
        <select className={`${shared} ${className}`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input className={`${shared} ${className}`} {...props} />
      )}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
