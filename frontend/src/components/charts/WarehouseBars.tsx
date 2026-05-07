import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export function WarehouseBars({
  data,
  height = 240,
}: {
  data: Array<{ name: string; articles: number; variance: number }>;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barSize={18}>
          <defs>
            <linearGradient id="articlesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity={1} />
              <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="varianceBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(168,85,247)" stopOpacity={1} />
              <stop offset="100%" stopColor="rgb(236,72,153)" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
            stroke="rgb(var(--border))"
          />
          <YAxis
            tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
            stroke="rgb(var(--border))"
            width={36}
          />
          <Tooltip cursor={{ fill: "rgb(var(--surface-elevated)/0.6)" }} content={<ChartTooltip />} />
          <Bar
            dataKey="articles"
            fill="url(#articlesGrad)"
            radius={[6, 6, 0, 0]}
            name="Articles"
          />
          <Bar
            dataKey="variance"
            fill="url(#varianceBarGrad)"
            radius={[6, 6, 0, 0]}
            name="Variance"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
