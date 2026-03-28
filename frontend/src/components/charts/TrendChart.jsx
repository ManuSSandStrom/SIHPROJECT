import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardBody, CardHeader } from "../common/Card";

export function TrendChart({ title, description, data, dataKey = "count", labelKey = "_id", variant = "line" }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="min-w-0">
        <div className="h-80 min-h-[20rem] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          {variant === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={labelKey} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey={dataKey} fill="#2563eb" radius={[10, 10, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={labelKey} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="#0f4fd6" strokeWidth={3} dot={{ fill: "#0f4fd6" }} />
            </LineChart>
          )}
        </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
