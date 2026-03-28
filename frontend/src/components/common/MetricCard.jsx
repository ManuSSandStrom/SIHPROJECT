import { ArrowUpRight } from "lucide-react";
import { Card, CardBody } from "./Card";

export function MetricCard({ title, value, hint, icon: Icon }) {
  return (
    <Card className="overflow-hidden">
      <CardBody className="relative">
        <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          {Icon ? <Icon size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      </CardBody>
    </Card>
  );
}
