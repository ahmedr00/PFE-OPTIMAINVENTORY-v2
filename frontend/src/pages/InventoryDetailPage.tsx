import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  Layers,
  Loader2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Upload,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { aiService, articleService, inventoryService, warehouseService } from "@/api/services";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CSVDropzone, type CSVPreview } from "@/components/csv/CSVDropzone";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { Progress } from "@/components/ui/Progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { exportToCsv } from "@/components/data-table/DataTable";
import { initials, formatNumber, formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AIInsights, Article, Warehouse } from "@/types/domain";

type ArticleStatus = "conform" | "missing" | "excess" | "pending";

type ArticleWithStatus = Article & {
  status: ArticleStatus;
  variance: number;
  variancePct: number;
};

function classify(article: Article): ArticleStatus {
  if (article.countedQuantity === null || article.countedQuantity === undefined) return "pending";
  const theoretical = article.theoreticalQuantity ?? 0;
  if (article.countedQuantity === theoretical) return "conform";
  return article.countedQuantity < theoretical ? "missing" : "excess";
}

export function InventoryDetailPage({
  id,
  navigate,
}: {
  id: string;
  navigate: (path: string) => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | ArticleStatus>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);

  const report = useQuery({
    queryKey: ["inventory-comparison", id],
    queryFn: () => inventoryService.comparison(id),
  });

  const articles = useQuery({
    queryKey: ["articles", report.data?.inventory.warehouseId],
    queryFn: () => articleService.byWarehouse(report.data!.inventory.warehouseId),
    enabled: Boolean(report.data?.inventory.warehouseId),
  });

  const warehouses = useQuery({
    queryKey: ["warehouses", report.data?.inventory.companyId],
    queryFn: () => warehouseService.byCompany(report.data!.inventory.companyId),
    enabled: Boolean(report.data?.inventory.companyId),
  });

  const ai = useQuery({
    queryKey: ["ai-insights", "inventory", id],
    queryFn: () => aiService.reportInsights({ inventoryId: id }),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => inventoryService.uploadTechnical(id, file),
    onSuccess: (result) => {
      toast.success(`${result.matched} of ${result.imported} rows matched`, {
        description: "Comparison records have been refreshed.",
      });
      queryClient.invalidateQueries({ queryKey: ["inventory-comparison", id] });
      queryClient.invalidateQueries({ queryKey: ["articles", report.data?.inventory.warehouseId] });
      setCsvFile(null);
      setCsvPreview(null);
      setUploadOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not upload technical CSV");
    },
  });

  const enriched: ArticleWithStatus[] = useMemo(() => {
    return (articles.data || []).map((article) => {
      const status = classify(article);
      const theoretical = article.theoreticalQuantity ?? 0;
      const counted = article.countedQuantity ?? 0;
      const variance = counted - theoretical;
      const variancePct = theoretical === 0 ? 0 : (variance / theoretical) * 100;
      return { ...article, status, variance, variancePct };
    });
  }, [articles.data]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const conform = enriched.filter((article) => article.status === "conform").length;
    const missing = enriched.filter((article) => article.status === "missing").length;
    const excess = enriched.filter((article) => article.status === "excess").length;
    const pending = enriched.filter((article) => article.status === "pending").length;
    const counted = total - pending;
    const accuracy = counted === 0 ? 0 : (conform / counted) * 100;
    const completion = total === 0 ? 0 : (counted / total) * 100;
    const totalVariance = enriched.reduce((acc, article) => acc + Math.abs(article.variance), 0);
    return { total, conform, missing, excess, pending, counted, accuracy, completion, totalVariance };
  }, [enriched]);

  const filtered = useMemo(() => {
    if (tab === "all") return enriched;
    return enriched.filter((article) => article.status === tab);
  }, [enriched, tab]);

  if (report.isLoading || !report.data) {
    return (
      <section className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  const inventory = report.data.inventory;
  const counter =
    typeof inventory.assignedCounterId === "object" && inventory.assignedCounterId
      ? inventory.assignedCounterId
      : null;

  const statusTone =
    inventory.status === "Closed"
      ? "emerald"
      : inventory.status === "In Progress"
        ? "primary"
        : "amber";

  const warehouseName =
    (warehouses.data || []).find((warehouse) => warehouse._id === inventory.warehouseId)?.name ||
    "Warehouse";

  const warehouse: Warehouse | undefined = (warehouses.data || []).find(
    (w) => w._id === inventory.warehouseId,
  );

  return (
    <section className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => navigate("/app/inventories")}
      >
        <ArrowLeft className="size-4" /> Back to inventories
      </Button>

      <InventoryHero
        name={inventory.name}
        status={inventory.status}
        statusTone={statusTone}
        warehouseName={warehouseName}
        warehouseLocation={warehouse?.location}
        counterName={counter?.name || counter?.email || null}
        counterInitials={counter ? initials(counter.name || undefined, counter.email) : null}
        completion={stats.completion}
        accuracy={stats.accuracy}
        totalArticles={stats.total}
        countedArticles={stats.counted}
        createdAt={inventory.inventoryDate}
        technicalUploadedAt={report.data.technical?.uploadedAt}
        onUpload={() => setUploadOpen(true)}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Target className="size-4" />}
          label="Accuracy"
          value={`${stats.accuracy.toFixed(1)}%`}
          tone={stats.accuracy >= 90 ? "emerald" : stats.accuracy >= 70 ? "primary" : "amber"}
        />
        <KpiCard
          icon={<CheckCircle2 className="size-4" />}
          label="Conform"
          value={formatNumber(stats.conform)}
          tone="emerald"
        />
        <KpiCard
          icon={<TrendingDown className="size-4" />}
          label="Missing"
          value={formatNumber(stats.missing)}
          tone="amber"
        />
        <KpiCard
          icon={<TrendingUp className="size-4" />}
          label="Excess"
          value={formatNumber(stats.excess)}
          tone="crimson"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" /> Comparison
                </CardTitle>
                <CardDescription>
                  {stats.counted} of {stats.total} articles counted • {stats.pending} pending
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  exportToCsv(`${inventory.name}-comparison.csv`, enriched, [
                    { key: "code", label: "code" },
                    { key: "name", label: "name" },
                    { key: "location", label: "location" },
                    { key: "theoreticalQuantity", label: "theoretical" },
                    { key: "countedQuantity", label: "counted" },
                    { key: "variance", label: "variance" },
                    { key: "status", label: "status" },
                  ])
                }
              >
                <Download className="size-4" /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="all">
                  All <Counter value={stats.total} />
                </TabsTrigger>
                <TabsTrigger value="conform">
                  Conform <Counter value={stats.conform} tone="emerald" />
                </TabsTrigger>
                <TabsTrigger value="missing">
                  Missing <Counter value={stats.missing} tone="amber" />
                </TabsTrigger>
                <TabsTrigger value="excess">
                  Excess <Counter value={stats.excess} tone="crimson" />
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending <Counter value={stats.pending} />
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab}>
                {articles.isLoading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title={tab === "all" ? "No articles in this warehouse" : `No ${tab} articles`}
                    body={
                      tab === "all"
                        ? "Add articles to the warehouse first."
                        : "This bucket is empty for now."
                    }
                  />
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
                    <div className="max-h-[480px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-surface-elevated/95 backdrop-blur">
                          <tr className="border-b border-border">
                            <Th>Code</Th>
                            <Th>Name</Th>
                            <Th align="right">Theoretical</Th>
                            <Th align="right">Counted</Th>
                            <Th align="right">Variance</Th>
                            <Th>Status</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice(0, 200).map((article) => (
                            <ArticleRow key={article._id} article={article} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filtered.length > 200 && (
                      <div className="border-t border-border bg-surface-elevated/40 px-3 py-2 text-center text-xs text-muted-foreground">
                        Showing first 200 of {filtered.length} entries — use Export for full data
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <AIInsightsPanel ai={ai.data?.ai} loading={ai.isLoading} />
      </div>

      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Upload technical CSV</SheetTitle>
            <SheetDescription>
              Two columns expected: <code>code</code> (or <code>reference</code>) and{" "}
              <code>technicalQty</code>.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 px-6 pb-6">
            <CSVDropzone
              file={csvFile}
              onFileChange={(file, preview) => {
                setCsvFile(file);
                setCsvPreview(preview);
              }}
              expectedColumns={["code", "technicalQty"]}
              description="Two-column CSV to refresh the technical baseline."
            />
            {csvPreview && (
              <Notice tone="info">
                {csvPreview.rowCount} rows ready. Matching to articles in this warehouse.
              </Notice>
            )}
            <Button
              variant="ai"
              disabled={!csvFile || upload.isPending}
              onClick={() => csvFile && upload.mutate(csvFile)}
            >
              {upload.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload technical CSV
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function InventoryHero({
  name,
  status,
  statusTone,
  warehouseName,
  warehouseLocation,
  counterName,
  counterInitials,
  completion,
  accuracy,
  totalArticles,
  countedArticles,
  createdAt,
  technicalUploadedAt,
  onUpload,
}: {
  name: string;
  status: string;
  statusTone: "amber" | "primary" | "emerald";
  warehouseName: string;
  warehouseLocation?: string;
  counterName: string | null;
  counterInitials: string | null;
  completion: number;
  accuracy: number;
  totalArticles: number;
  countedArticles: number;
  createdAt?: string | null;
  technicalUploadedAt?: string | null;
  onUpload: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="absolute -right-32 -top-32 size-72 rounded-full bg-gradient-to-br from-ai-from/15 to-indigo/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 size-72 rounded-full bg-gradient-to-br from-primary/10 to-ai-to/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone}>{status}</Badge>
            <Badge tone="primary">
              <WarehouseIcon className="size-3" /> {warehouseName}
            </Badge>
            {warehouseLocation && (
              <span className="text-xs text-muted-foreground">{warehouseLocation}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> Created {formatRelativeDate(createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="size-3.5" /> Technical{" "}
              {technicalUploadedAt
                ? formatRelativeDate(technicalUploadedAt)
                : "not yet uploaded"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {counterInitials ? (
                <Avatar className="size-8">
                  <AvatarFallback className="text-[10px]">{counterInitials}</AvatarFallback>
                </Avatar>
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                  <UserCheck className="size-4" />
                </span>
              )}
              <p className="text-sm font-semibold">{counterName || "No counter assigned"}</p>
            </div>
            <Button variant="ai" onClick={onUpload}>
              <FileSpreadsheet className="size-4" /> Upload technical CSV
            </Button>
          </div>
        </div>

        <CompletionRing completion={completion} accuracy={accuracy} totalArticles={totalArticles} countedArticles={countedArticles} />
      </div>
    </motion.div>
  );
}

function CompletionRing({
  completion,
  accuracy,
  totalArticles,
  countedArticles,
}: {
  completion: number;
  accuracy: number;
  totalArticles: number;
  countedArticles: number;
}) {
  const safeCompletion = Math.min(100, Math.max(0, completion));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeCompletion / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 140 140" className="size-32 -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-[rgb(var(--surface-elevated))]"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="10"
            stroke="url(#completion-gradient)"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="completion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(99,102,241)" />
              <stop offset="100%" stopColor="rgb(168,85,247)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold tabular">{safeCompletion.toFixed(0)}%</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Complete
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Counted</span>
            <span className="tabular text-foreground">
              {countedArticles}/{totalArticles}
            </span>
          </div>
          <Progress value={safeCompletion} className="h-1.5" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Accuracy</span>
            <span className="tabular text-foreground">{accuracy.toFixed(1)}%</span>
          </div>
          <Progress
            value={accuracy}
            className="h-1.5"
            indicatorClassName="bg-gradient-to-r from-emerald to-primary"
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "emerald" | "primary" | "amber" | "crimson";
}) {
  const toneStyles =
    tone === "emerald"
      ? "border-emerald/30 bg-emerald/10 text-emerald"
      : tone === "primary"
        ? "border-primary/30 bg-primary/10 text-primary"
        : tone === "amber"
          ? "border-amber/30 bg-amber/10 text-amber"
          : tone === "crimson"
            ? "border-crimson/30 bg-crimson/10 text-crimson"
            : "border-border bg-surface-elevated text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span className={cn("flex size-10 items-center justify-center rounded-xl border", toneStyles)}>
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular">{value}</p>
      </div>
    </div>
  );
}

function Counter({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "emerald" | "amber" | "crimson";
}) {
  return (
    <span
      className={cn(
        "ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular",
        tone === "emerald"
          ? "bg-emerald/15 text-emerald"
          : tone === "amber"
            ? "bg-amber/15 text-amber"
            : tone === "crimson"
              ? "bg-crimson/15 text-crimson"
              : "bg-surface-elevated text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function ArticleRow({ article }: { article: ArticleWithStatus }) {
  const tone =
    article.status === "conform"
      ? "emerald"
      : article.status === "missing"
        ? "amber"
        : article.status === "excess"
          ? "crimson"
          : "slate";
  return (
    <tr className="border-t border-border/60 transition-colors hover:bg-surface-elevated/60">
      <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-foreground/85">
        {article.code}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-medium">{article.name}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right tabular text-muted-foreground">
        {article.theoreticalQuantity ?? 0}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right tabular">
        {article.countedQuantity ?? "—"}
      </td>
      <td
        className={cn(
          "whitespace-nowrap px-3 py-2 text-right tabular font-semibold",
          article.variance > 0
            ? "text-crimson"
            : article.variance < 0
              ? "text-amber"
              : "text-emerald",
        )}
      >
        {article.variance > 0 ? "+" : ""}
        {article.status === "pending" ? "—" : article.variance}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <Badge tone={tone}>{capitalize(article.status)}</Badge>
      </td>
    </tr>
  );
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function AIInsightsPanel({ ai, loading }: { ai?: AIInsights; loading?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 ai-gradient" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="ai-gradient flex size-7 items-center justify-center rounded-md text-white">
            <Sparkles className="size-3.5" />
          </span>
          <span className="ai-text">AI insights</span>
        </CardTitle>
        <CardDescription>Auto-generated analysis for this inventory.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !ai ? (
          <p className="text-sm text-muted-foreground">No insights available yet.</p>
        ) : (
          <>
            <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3">
              <Badge tone="ai" className="mb-1.5">
                Summary
              </Badge>
              <p className="text-sm leading-relaxed">{ai.insights.summary}</p>
            </div>
            {ai.insights.topAnomalies?.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-amber" /> Anomalies
                </p>
                <ul className="flex flex-col gap-1.5">
                  {ai.insights.topAnomalies.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-amber/20 bg-amber/5 p-2 text-xs"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ai.insights.recommendedActions?.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald" /> Recommendations
                </p>
                <ul className="flex flex-col gap-1.5">
                  {ai.insights.recommendedActions.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-emerald/20 bg-emerald/5 p-2 text-xs"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Badge tone="outline" className="self-start text-[10px]">
              {ai.provider} • {ai.model}
            </Badge>
          </>
        )}
      </CardContent>
    </Card>
  );
}
