import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import {
  analyticsService,
  aiService,
  companyService,
  inventoryService,
  trialRequestService,
  userService,
  warehouseService,
} from "@/api/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { StatusDonut } from "@/components/charts/StatusDonut";
import { TrendChart } from "@/components/charts/TrendChart";
import { WarehouseBars } from "@/components/charts/WarehouseBars";
import { useUIStore } from "@/store/ui";
import { initials, formatRelativeDate } from "@/lib/format";
import { displayRole } from "@/utils/roles";
import type { Inventory, User } from "@/types/domain";

export function DashboardPage({ user, navigate }: { user: User; navigate: (path: string) => void }) {
  if (user.role === "SuperAdmin") return <SuperAdminDashboard user={user} navigate={navigate} />;
  return <AdminDashboard user={user} navigate={navigate} />;
}

/* -------------------- SUPER ADMIN -------------------- */

function SuperAdminDashboard({
  user,
  navigate,
}: {
  user: User;
  navigate: (path: string) => void;
}) {
  const companies = useQuery({ queryKey: ["companies"], queryFn: companyService.list });
  const users = useQuery({ queryKey: ["users"], queryFn: userService.list });
  const requests = useQuery({
    queryKey: ["trial-requests", "pending"],
    queryFn: () => trialRequestService.list("pending"),
  });
  const analytics = useQuery({
    queryKey: ["analytics", "dashboard", "platform"],
    queryFn: () => analyticsService.dashboard(),
  });

  const adminCount = analytics.data?.totals.admins ?? users.data?.users.filter((u) => u.role === "CompanyOwner" || u.role === "Admin").length ?? 0;
  const counterCount = analytics.data?.totals.counters ?? users.data?.users.filter((u) => u.role === "InventoryPersonnel" || u.role === "Compteur").length ?? 0;

  const recentRequests = (requests.data?.requests || []).slice(0, 5);
  const recentCompanies = (companies.data || []).slice(-5).reverse();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Platform overview"
        title={`Hello ${user.name?.split(" ")[0] || "Admin"}`}
        description="Approve trial requests, monitor tenant health, and keep your platform running smoothly."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/app/users")}>
              <Users className="size-4" /> Manage users
            </Button>
            <Button variant="default" onClick={() => navigate("/app/companies")}>
              <ClipboardList className="size-4" /> Review requests
              {recentRequests.length > 0 && (
                <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {recentRequests.length}
                </span>
              )}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Companies"
          value={analytics.data?.totals.companies ?? companies.data?.length ?? "—"}
          hint={analytics.isLoading ? "Loading…" : "Across the platform"}
          icon={Building2}
          tone="primary"
        />
        <StatCard
          label="Pending requests"
          value={analytics.data?.totals.pendingRequests ?? requests.data?.requests.length ?? "—"}
          hint="Awaiting your approval"
          icon={ClipboardList}
          tone={recentRequests.length ? "amber" : "default"}
        />
        <StatCard label="Admins" value={adminCount} hint="Company owners + admins" icon={Users} />
        <StatCard
          label="Counters"
          value={counterCount}
          hint="Field counters in the platform"
          icon={Target}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Platform accuracy trend</CardTitle>
                <CardDescription>Aggregate accuracy across all tenants over the last 12 weeks.</CardDescription>
              </div>
              <Badge tone="primary">Database</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart data={analytics.data?.trend || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>Approve or reject from Companies.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {requests.isLoading && <Skeleton className="h-32 w-full" />}
            {!requests.isLoading && recentRequests.length === 0 && (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up"
                body="There are no trial requests pending review."
              />
            )}
            {recentRequests.map((request) => (
              <button
                key={request._id}
                onClick={() => navigate("/app/companies")}
                className="flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3 text-left transition-colors hover:bg-surface-elevated"
              >
                <Avatar className="size-9">
                  <AvatarFallback>{initials(request.adminName, request.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{request.companyName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {request.adminName} • {request.email}
                  </p>
                </div>
                <Badge tone="amber">Pending</Badge>
              </button>
            ))}
            {requests.data && requests.data.requests.length > 5 && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/companies")}>
                View all <ArrowRight className="size-3.5" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent companies</CardTitle>
            <CardDescription>Latest tenants provisioned on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {companies.isLoading && <Skeleton className="h-32 w-full" />}
            {!companies.isLoading && recentCompanies.length === 0 && (
              <EmptyState
                icon={Building2}
                title="No companies yet"
                body="Approve a trial request to provision the first company."
              />
            )}
            {recentCompanies.map((company) => (
              <div
                key={company._id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-indigo text-xs font-bold text-white">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{company.name}</p>
                  {company.legalName && (
                    <p className="truncate text-xs text-muted-foreground">{company.legalName}</p>
                  )}
                </div>
                <Badge tone="emerald">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity intensity</CardTitle>
            <CardDescription>Tenant activity across the last 12 weeks.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap data={analytics.data?.activity} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* -------------------- ADMIN -------------------- */

function AdminDashboard({ user, navigate }: { user: User; navigate: (path: string) => void }) {
  const companyId = user.companyId || "";
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
  const ai = useQuery({
    queryKey: ["ai-insights", companyId],
    queryFn: () => aiService.reportInsights({ companyId }),
    enabled: Boolean(companyId),
  });
  const analytics = useQuery({
    queryKey: ["analytics", "dashboard", companyId],
    queryFn: () => analyticsService.dashboard({ companyId }),
    enabled: Boolean(companyId),
  });

  const { open, inProgress, closed } = useMemo(() => {
    const list = inventories.data || [];
    return {
      open: list.filter((inv) => inv.status === "Open").length,
      inProgress: list.filter((inv) => inv.status === "In Progress").length,
      closed: list.filter((inv) => inv.status === "Closed").length,
    };
  }, [inventories.data]);

  const accuracy = analytics.data?.totals.accuracy ?? 0;

  const donutData = useMemo(() => {
    const status = analytics.data?.statusCounts || ai.data?.stats.statusCounts;
    return [
      { name: "Conform", value: status?.conform || 0 },
      { name: "Missing", value: status?.missing || 0 },
      { name: "Excess", value: status?.excess || 0 },
    ];
  }, [ai.data]);

  const warehouseBarsData = analytics.data?.warehouseBars || [];

  const recentInventories = (inventories.data || []).slice(0, 5);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`${displayRole(user.role)} workspace`}
        title={`Welcome back, ${user.name?.split(" ")[0] || "team"}`}
        description="Monitor inventory health, dispatch your counters, and let Optima AI surface what matters."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/app/warehouses")}>
              <Plus className="size-4" /> New warehouse
            </Button>
            <Button variant="ai" onClick={() => navigate("/app/inventories")}>
              <Plus className="size-4" /> New inventory
            </Button>
          </>
        }
      />

      <AISummaryHero user={user} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Inventory accuracy"
          value={`${accuracy.toFixed(1)}%`}
          hint="Conform rate (last cycle)"
          icon={Target}
          tone={accuracy >= 95 ? "emerald" : accuracy >= 80 ? "primary" : "amber"}
          delta={1.4}
        />
        <StatCard
          label="Active inventories"
          value={open + inProgress}
          hint={`${closed} closed`}
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="Warehouses"
          value={warehouses.data?.length ?? "—"}
          hint="Linked to your workspace"
          icon={Warehouse}
        />
        <StatCard
          label="Discrepancies"
          value={(ai.data?.stats.statusCounts?.missing || 0) + (ai.data?.stats.statusCounts?.excess || 0)}
          hint="Missing + excess"
          icon={TrendingUp}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Accuracy & variance trend</CardTitle>
                <CardDescription>Counting performance across recent cycles.</CardDescription>
              </div>
              <Badge tone="primary">Last 8 weeks</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart data={analytics.data?.trend || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
            <CardDescription>Conform vs missing vs excess.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonut data={donutData} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <DonutLegend dot="bg-emerald" label="Conform" value={donutData[0]?.value || 0} />
              <DonutLegend dot="bg-amber" label="Missing" value={donutData[1]?.value || 0} />
              <DonutLegend dot="bg-crimson" label="Excess" value={donutData[2]?.value || 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Warehouse pulse</CardTitle>
                <CardDescription>Article volume and variance per warehouse.</CardDescription>
              </div>
              {warehouseBarsData.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/app/warehouses")}>
                  View all <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {warehouseBarsData.length === 0 ? (
              <EmptyState
                icon={Warehouse}
                title="No warehouses yet"
                body="Create your first warehouse to start tracking inventory."
                action={
                  <Button variant="ai" size="sm" onClick={() => navigate("/app/warehouses")}>
                    <Plus className="size-4" /> Create warehouse
                  </Button>
                }
              />
            ) : (
              <WarehouseBars data={warehouseBarsData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Counting activity over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap data={analytics.data?.activity} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent inventories</CardTitle>
              <CardDescription>Jump back into ongoing operations.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/inventories")}>
              View all <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {inventories.isLoading && <Skeleton className="h-24 w-full" />}
          {!inventories.isLoading && recentInventories.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="No inventories yet"
              body="Create your first inventory to assign a counter and start counting."
              action={
                <Button variant="ai" size="sm" onClick={() => navigate("/app/inventories")}>
                  <Plus className="size-4" /> Create inventory
                </Button>
              }
            />
          )}
          {recentInventories.map((inventory) => (
            <InventoryRow
              key={inventory._id}
              inventory={inventory}
              onClick={() => navigate(`/app/inventories/${inventory._id}`)}
            />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function InventoryRow({
  inventory,
  onClick,
}: {
  inventory: Inventory;
  onClick: () => void;
}) {
  const status = inventory.status;
  const tone =
    status === "Closed" ? "emerald" : status === "In Progress" ? "primary" : "amber";
  const progress =
    status === "Closed" ? 100 : status === "In Progress" ? 60 : 0;

  return (
    <motion.button
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3 text-left transition-colors hover:bg-surface-elevated"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-indigo/30 text-primary">
        <ClipboardList className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{inventory.name}</p>
          <Badge tone={tone}>{status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatRelativeDate(inventory.inventoryDate)} •{" "}
          {typeof inventory.assignedCounterId === "object" && inventory.assignedCounterId
            ? inventory.assignedCounterId.name || inventory.assignedCounterId.email
            : "No counter assigned"}
        </p>
      </div>
      <div className="hidden w-32 sm:block">
        <Progress value={progress} className="h-1.5" />
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </motion.button>
  );
}

function DonutLegend({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-elevated/60 p-2 text-center">
      <div className="mb-1 flex items-center justify-center gap-1.5">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-base font-bold tabular">{value}</p>
    </div>
  );
}

/* -------------------- AI HERO -------------------- */

function AISummaryHero({ user }: { user: User }) {
  const setAIOpen = useUIStore((state) => state.setAIAssistantOpen);
  const ai = useQuery({
    queryKey: ["ai-insights", user.companyId],
    queryFn: () => aiService.reportInsights({ companyId: user.companyId || undefined }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-transparent bg-gradient-to-br from-ai-from/15 via-indigo/10 to-ai-to/20 p-6 shadow-[0_30px_80px_-30px_rgb(var(--ai-from)/0.55)]"
    >
      <div className="absolute -right-16 -top-16 size-64 rounded-full bg-gradient-to-br from-ai-from/40 to-ai-to/30 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-gradient-to-br from-primary/30 to-indigo/30 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <span className="ai-gradient flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_12px_30px_-10px_rgb(var(--ai-from)/0.7)]">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-1">
            <Badge tone="ai" className="px-2.5">
              <Sparkles className="size-3" /> Optima AI
            </Badge>
            <p className="text-sm leading-relaxed text-foreground/90">
              {ai.isLoading
                ? "Analysing your latest inventory cycles…"
                : ai.data?.ai.insights.summary ||
                  "Run an inventory cycle to unlock AI-generated operational insights."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {ai.data?.ai && (
            <Badge tone="outline" className="border-border-strong text-muted-foreground">
              {ai.data.ai.provider} • {ai.data.ai.model}
            </Badge>
          )}
          <Button variant="ai" size="sm" onClick={() => setAIOpen(true)}>
            <Sparkles className="size-4" /> Open assistant
          </Button>
        </div>
      </div>

      {ai.data?.ai && (ai.data.ai.insights.topAnomalies?.length || 0) > 0 && (
        <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
          {ai.data.ai.insights.topAnomalies.slice(0, 2).map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-md)] border border-amber/30 bg-amber/10 p-3 text-sm text-foreground/85"
            >
              <Boxes className="mb-1 size-4 text-amber" />
              {item}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
