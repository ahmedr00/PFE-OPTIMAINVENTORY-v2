import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Filter,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { aiService, inventoryService, warehouseService } from "@/api/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { exportToCsv } from "@/components/data-table/DataTable";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { AIInsights, AIStats, User } from "@/types/domain";

type Filters = {
  warehouseId: string;
  inventoryId: string;
};

export function ReportsPage({ user }: { user: User }) {
  const companyId = user.companyId || "";
  const [filters, setFilters] = useState<Filters>({ warehouseId: "all", inventoryId: "all" });
  const setAIOpen = useUIStore((state) => state.setAIAssistantOpen);

  const warehouses = useQuery({
    queryKey: ["warehouses", companyId],
    queryFn: () => warehouseService.byCompany(companyId),
    enabled: Boolean(companyId),
  });
  const inventories = useQuery({
    queryKey: ["inventories", companyId],
    queryFn: () => inventoryService.byCompany(companyId),
    enabled: Boolean(companyId),
  });

  const filteredInventories = useMemo(() => {
    if (filters.warehouseId === "all") return inventories.data || [];
    return (inventories.data || []).filter((inv) => inv.warehouseId === filters.warehouseId);
  }, [filters.warehouseId, inventories.data]);

  const insights = useQuery({
    queryKey: ["ai-insights", "reports", companyId, filters.warehouseId, filters.inventoryId],
    queryFn: () =>
      aiService.reportInsights({
        companyId,
        warehouseId: filters.warehouseId === "all" ? undefined : filters.warehouseId,
        inventoryId: filters.inventoryId === "all" ? undefined : filters.inventoryId,
      }),
    enabled: Boolean(companyId),
  });

  if (!companyId) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader eyebrow="Intelligence" title="AI Reports" />
        <Notice tone="warn" title="Account not linked to a company">
          Ask a SuperAdmin to assign your account to a company before generating AI reports.
        </Notice>
      </section>
    );
  }

  const stats = insights.data?.stats;
  const ai = insights.data?.ai;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Reports"
        description="Conversational analysis, anomaly detection, and recommended actions for every cycle."
        actions={
          <Button variant="ai" onClick={() => setAIOpen(true)}>
            <Sparkles className="size-4" /> Open assistant
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-muted-foreground" /> Scope
            </CardTitle>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select
                value={filters.warehouseId}
                onValueChange={(value) =>
                  setFilters({ warehouseId: value, inventoryId: "all" })
                }
              >
                <SelectTrigger className="h-9 w-56">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All warehouses</SelectItem>
                  {(warehouses.data || []).map((warehouse) => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.inventoryId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, inventoryId: value }))}
              >
                <SelectTrigger className="h-9 w-64">
                  <SelectValue placeholder="Inventory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All inventories</SelectItem>
                  {filteredInventories.map((inventory) => (
                    <SelectItem key={inventory._id} value={inventory._id}>
                      {inventory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {insights.isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !ai || !stats ? (
        <EmptyState
          icon={Sparkles}
          title="No data to analyse yet"
          body="Run an inventory cycle, then come back to view AI-generated insights."
        />
      ) : (
        <>
          <ConversationalSummary ai={ai} stats={stats} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              icon={<CheckCircle2 className="size-4" />}
              label="Conform"
              value={formatNumber(stats.statusCounts?.conform || 0)}
              tone="emerald"
            />
            <KpiTile
              icon={<AlertTriangle className="size-4" />}
              label="Missing"
              value={formatNumber(stats.statusCounts?.missing || 0)}
              tone="amber"
            />
            <KpiTile
              icon={<TrendingUp className="size-4" />}
              label="Excess"
              value={formatNumber(stats.statusCounts?.excess || 0)}
              tone="crimson"
            />
            <KpiTile
              icon={<BarChart3 className="size-4" />}
              label="Variance"
              value={formatNumber(Math.round(stats.varianceTotals?.absoluteVariance || 0))}
              tone="primary"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Variance breakdown</CardTitle>
                <CardDescription>Quantity gap split between missing and excess.</CardDescription>
              </CardHeader>
              <CardContent>
                <VarianceBars stats={stats} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Status mix</CardTitle>
                <CardDescription>Conform vs missing vs excess.</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusPie stats={stats} />
              </CardContent>
            </Card>
          </div>

          <RecommendationCards ai={ai} />

          <ExportToolbar ai={ai} stats={stats} />
        </>
      )}
    </section>
  );
}

function ConversationalSummary({ ai, stats }: { ai: AIInsights; stats: AIStats }) {
  const conform = stats.statusCounts?.conform || 0;
  const total =
    conform + (stats.statusCounts?.missing || 0) + (stats.statusCounts?.excess || 0);
  const accuracy = total === 0 ? 0 : (conform / total) * 100;
  const confidence = Math.min(98, Math.max(60, 70 + Math.round(accuracy / 4)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-gradient-to-br from-ai-from/12 via-indigo/8 to-ai-to/15 p-6 shadow-[0_30px_80px_-30px_rgb(var(--ai-from)/0.45)]"
    >
      <div className="absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br from-ai-from/30 to-ai-to/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 size-72 rounded-full bg-gradient-to-br from-primary/30 to-indigo/20 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-3xl items-start gap-4">
          <span className="ai-gradient flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_12px_30px_-10px_rgb(var(--ai-from)/0.7)]">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone="ai">Optima AI</Badge>
              <Badge tone="outline" className="text-[10px]">
                {ai.provider} • {ai.model}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-foreground/95 sm:text-base">
              {ai.insights.summary}
            </p>
          </div>
        </div>
        <ConfidenceRing value={confidence} />
      </div>
    </motion.div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, value) / 100) * circumference;
  return (
    <div className="flex items-center gap-3 self-end lg:self-center">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            className="stroke-[rgb(var(--surface-elevated))]"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            stroke="url(#confidence-gradient)"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(168,85,247)" />
              <stop offset="100%" stopColor="rgb(236,72,153)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold tabular">{value}%</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Confidence
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "crimson" | "primary";
}) {
  const styles =
    tone === "emerald"
      ? "border-emerald/30 bg-emerald/8 text-emerald"
      : tone === "amber"
        ? "border-amber/30 bg-amber/8 text-amber"
        : tone === "crimson"
          ? "border-crimson/30 bg-crimson/8 text-crimson"
          : "border-primary/30 bg-primary/8 text-primary";

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span className={cn("flex size-10 items-center justify-center rounded-xl border", styles)}>
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold tabular">{value}</p>
      </div>
    </div>
  );
}

function VarianceBars({ stats }: { stats: AIStats }) {
  const data = [
    {
      name: "Missing",
      qty: stats.varianceTotals?.missingQuantity || 0,
      color: "rgb(251,191,36)",
    },
    {
      name: "Excess",
      qty: stats.varianceTotals?.excessQuantity || 0,
      color: "rgb(251,113,133)",
    },
    {
      name: "Absolute",
      qty: stats.varianceTotals?.absoluteVariance || 0,
      color: "rgb(99,102,241)",
    },
    {
      name: "Value impact",
      qty: Math.abs(stats.varianceTotals?.inventoryValueVariance || 0),
      color: "rgb(168,85,247)",
    },
  ];
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barSize={28}>
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
          <Bar dataKey="qty" radius={[6, 6, 0, 0]} name="Quantity">
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusPie({ stats }: { stats: AIStats }) {
  const data = [
    { name: "Conform", value: stats.statusCounts?.conform || 0, color: "rgb(52,211,153)" },
    { name: "Missing", value: stats.statusCounts?.missing || 0, color: "rgb(251,191,36)" },
    { name: "Excess", value: stats.statusCounts?.excess || 0, color: "rgb(251,113,133)" },
  ];
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="92%"
            paddingAngle={3}
            dataKey="value"
            cornerRadius={8}
            stroke="rgb(var(--surface))"
            strokeWidth={4}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function RecommendationCards({ ai }: { ai: AIInsights }) {
  const anomalies = ai.insights.topAnomalies || [];
  const actions = ai.insights.recommendedActions || [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ExpandableCard
        icon={<AlertTriangle className="size-4" />}
        accent="amber"
        title="Top anomalies"
        description="What stands out in this scope."
        items={anomalies}
      />
      <ExpandableCard
        icon={<Lightbulb className="size-4" />}
        accent="emerald"
        title="Recommended actions"
        description="What to do next."
        items={actions}
      />
    </div>
  );
}

function ExpandableCard({
  icon,
  title,
  description,
  items,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  accent: "amber" | "emerald";
}) {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl",
              accent === "amber"
                ? "bg-amber/15 text-amber"
                : "bg-emerald/15 text-emerald",
            )}
          >
            {icon}
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing flagged yet.</p>
        ) : (
          items.map((item, index) => (
            <button
              key={item + index}
              onClick={() => setExpanded(expanded === index ? null : index)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                accent === "amber"
                  ? "border-amber/30 bg-amber/5 hover:bg-amber/10"
                  : "border-emerald/30 bg-emerald/5 hover:bg-emerald/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular",
                  accent === "amber"
                    ? "bg-amber/20 text-amber"
                    : "bg-emerald/20 text-emerald",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-snug text-foreground/90",
                    expanded !== index && "line-clamp-2",
                  )}
                >
                  {item}
                </p>
                <AnimatePresence initial={false}>
                  {expanded === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tip: open the AI assistant for more context, or apply this directly to the
                        affected inventory.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  expanded === index && "rotate-180",
                )}
              />
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ExportToolbar({ ai, stats }: { ai: AIInsights; stats: AIStats }) {
  const exportInsights = () => {
    const rows: { type: string; content: string }[] = [
      { type: "summary", content: ai.insights.summary },
      ...ai.insights.topAnomalies.map((item) => ({ type: "anomaly", content: item })),
      ...ai.insights.recommendedActions.map((item) => ({ type: "action", content: item })),
    ];
    exportToCsv("optima-ai-insights.csv", rows, [
      { key: "type", label: "type" },
      { key: "content", label: "content" },
    ]);
  };

  return (
    <Card className="bg-gradient-to-br from-surface to-surface-elevated">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <span className="ai-gradient flex size-9 items-center justify-center rounded-xl text-white">
            <ClipboardList className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Generated {stats.generatedAt ? new Date(stats.generatedAt).toLocaleString() : "now"}</p>
            <p className="text-xs text-muted-foreground">
              Source: <span className="font-mono">{stats.source || "live"}</span> ·{" "}
              {stats.totals?.comparisons || 0} comparisons analysed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportInsights}>
            <Download className="size-4" /> Export insights
          </Button>
          <Badge tone="ai">
            <Sparkles className="size-3" /> Live AI
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
