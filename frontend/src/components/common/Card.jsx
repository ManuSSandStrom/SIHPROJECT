import { cn } from "../../utils/formatters";

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-sky-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
