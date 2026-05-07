import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["rgb(52,211,153)", "rgb(251,191,36)", "rgb(251,113,133)"];

export function StatusDonut({
  data,
  height = 220,
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  return (
    <div className="relative" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="92%"
            paddingAngle={3}
            dataKey="value"
            stroke="rgb(var(--surface))"
            strokeWidth={4}
            isAnimationActive
            cornerRadius={10}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold tabular">{total}</p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">items</p>
      </div>
    </div>
  );
}
