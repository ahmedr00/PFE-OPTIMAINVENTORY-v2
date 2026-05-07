import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export function TrendChart({
  data,
  height = 240,
}: {
  data: Array<{ name: string; accuracy: number; variance: number }>;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="varianceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(168,85,247)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="rgb(168,85,247)" stopOpacity={0} />
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
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="rgb(99,102,241)"
            strokeWidth={2.5}
            fill="url(#accuracyGrad)"
            name="Accuracy"
          />
          <Area
            type="monotone"
            dataKey="variance"
            stroke="rgb(168,85,247)"
            strokeWidth={2}
            fill="url(#varianceGrad)"
            name="Variance"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
