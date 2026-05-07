import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  Filter,
  PlayCircle,
  Search,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { inventoryService, warehouseService } from "@/api/services";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { InventoryWizard } from "@/features/inventories/InventoryWizard";
import { initials, formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Inventory, User } from "@/types/domain";

const STATUS_TONE: Record<Inventory["status"], "amber" | "primary" | "emerald"> = {
  Open: "amber",
  "In Progress": "primary",
  Closed: "emerald",
};

const STATUS_PROGRESS: Record<Inventory["status"], number> = {
  Open: 0,
  "In Progress": 64,
  Closed: 100,
};

export function InventoriesPage({
  user,
  navigate,
}: {
  user: User;
  navigate: (path: string) => void;
}) {
  const companyId = user.companyId || "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Inventory["status"]>("all");

  const inventories = useQuery({
    queryKey: ["inventories", companyId],
    queryFn: () => inventoryService.byCompany(companyId),
    enabled: Boolean(companyId),
  });
  const warehouses = useQuery({
    queryKey: ["warehouses", companyId],
    queryFn: () => warehouseService.byCompany(companyId),
    enabled: Boolean(companyId),
  });

  const warehouseById = useMemo(() => {
    const map = new Map<string, string>();
    (warehouses.data || []).forEach((warehouse) => map.set(warehouse._id, warehouse.name));
    return map;
  }, [warehouses.data]);

  const counts = useMemo(() => {
    const list = inventories.data || [];
    return {
      total: list.length,
      open: list.filter((inv) => inv.status === "Open").length,
      inProgress: list.filter((inv) => inv.status === "In Progress").length,
      closed: list.filter((inv) => inv.status === "Closed").length,
    };
  }, [inventories.data]);

  const filtered = useMemo(() => {
    return (inventories.data || []).filter((inventory) => {
      if (statusFilter !== "all" && inventory.status !== statusFilter) return false;
      if (search.trim()) {
        const lower = search.toLowerCase();
        const counterName =
          typeof inventory.assignedCounterId === "object" && inventory.assignedCounterId
            ? `${inventory.assignedCounterId.name || ""} ${inventory.assignedCounterId.email || ""}`
            : "";
        const warehouseName = warehouseById.get(inventory.warehouseId) || "";
        return (
          inventory.name.toLowerCase().includes(lower) ||
          counterName.toLowerCase().includes(lower) ||
          warehouseName.toLowerCase().includes(lower)
        );
      }
      return true;
    });
  }, [inventories.data, statusFilter, search, warehouseById]);

  if (!companyId) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader eyebrow="Operations" title="Inventories" />
        <Notice tone="warn" title="Account not linked to a company">
          Ask a SuperAdmin to assign your account to a company before launching inventories.
        </Notice>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Inventories"
        description="Launch counting cycles, track progress, and reconcile with technical stock."
        actions={<InventoryWizard companyId={companyId} />}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={counts.total} icon={<ClipboardList className="size-4" />} />
        <SummaryCard label="Open" value={counts.open} icon={<PlayCircle className="size-4" />} tone="amber" />
        <SummaryCard label="In progress" value={counts.inProgress} icon={<TrendingUp className="size-4" />} tone="primary" />
        <SummaryCard label="Closed" value={counts.closed} icon={<UserCheck className="size-4" />} tone="emerald" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-muted-foreground" /> Filters
            </CardTitle>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 w-72 pl-9"
                  placeholder="Search by name, counter, or warehouse"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Tabs
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="Open">Open</TabsTrigger>
                  <TabsTrigger value="In Progress">In progress</TabsTrigger>
                  <TabsTrigger value="Closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventories.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No inventories yet"
              body="Launch your first inventory cycle with the wizard."
              action={<InventoryWizard companyId={companyId} />}
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.04 } },
              }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((inventory) => (
                <motion.button
                  key={inventory._id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -3 }}
                  onClick={() => navigate(`/app/inventories/${inventory._id}`)}
                  className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl",
                          inventory.status === "Closed"
                            ? "bg-emerald/15 text-emerald"
                            : inventory.status === "In Progress"
                              ? "bg-primary/15 text-primary"
                              : "bg-amber/15 text-amber",
                        )}
                      >
                        <ClipboardList className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{inventory.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {warehouseById.get(inventory.warehouseId) || "Warehouse"}
                        </p>
                      </div>
                    </div>
                    <Badge tone={STATUS_TONE[inventory.status]}>{inventory.status}</Badge>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Progress</span>
                      <span className="tabular text-foreground">
                        {STATUS_PROGRESS[inventory.status]}%
                      </span>
                    </div>
                    <Progress value={STATUS_PROGRESS[inventory.status]} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {typeof inventory.assignedCounterId === "object" && inventory.assignedCounterId ? (
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px]">
                            {initials(inventory.assignedCounterId.name, inventory.assignedCounterId.email)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="flex size-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                          <UserCheck className="size-3.5" />
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {typeof inventory.assignedCounterId === "object" && inventory.assignedCounterId
                          ? inventory.assignedCounterId.name || inventory.assignedCounterId.email
                          : "Unassigned"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(inventory.inventoryDate)}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "amber" | "primary" | "emerald";
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          tone === "amber"
            ? "bg-amber/15 text-amber"
            : tone === "primary"
              ? "bg-primary/15 text-primary"
              : tone === "emerald"
                ? "bg-emerald/15 text-emerald"
                : "bg-surface-elevated text-muted-foreground",
        )}
      >
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
