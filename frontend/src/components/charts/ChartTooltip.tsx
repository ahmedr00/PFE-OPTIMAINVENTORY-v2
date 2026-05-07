type TooltipPayloadEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  suffix?: string;
};

export function ChartTooltip({ active, payload, label, suffix = "" }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined && label !== "" && (
        <p className="mb-1 font-bold text-foreground">{label}</p>
      )}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry: TooltipPayloadEntry, index: number) => (
          <div key={`${entry.dataKey ?? index}`} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color || "rgb(99,102,241)" }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-bold tabular text-foreground">
              {entry.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
