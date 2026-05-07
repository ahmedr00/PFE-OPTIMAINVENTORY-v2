import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LayoutGrid, MapPinned, Search, Warehouse as WarehouseIcon } from "lucide-react";
import { toast } from "sonner";
import { articleService, warehouseService } from "@/api/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { WarehouseCard } from "@/features/warehouses/WarehouseCard";
import { WarehouseMap } from "@/features/warehouses/WarehouseMap";
import { WarehouseCreateDialog } from "@/features/warehouses/WarehouseCreateDialog";
import { WarehouseDetailSheet } from "@/features/warehouses/WarehouseDetailSheet";
import type { User, Warehouse } from "@/types/domain";

export function WarehousesPage({ user }: { user: User }) {
  const companyId = user.companyId || "";
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  const warehouses = useQuery({
    queryKey: ["warehouses", companyId],
    queryFn: () => warehouseService.byCompany(companyId),
    enabled: Boolean(companyId),
  });

  const filtered = useMemo(() => {
    const list = warehouses.data || [];
    if (!search.trim()) return list;
    const lower = search.toLowerCase();
    return list.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(lower) ||
        (warehouse.location || "").toLowerCase().includes(lower),
    );
  }, [warehouses.data, search]);

  const articleCounts = useQueries({
    queries: filtered.map((warehouse) => ({
      queryKey: ["articles", warehouse._id, "count"],
      queryFn: async () => {
        const list = await articleService.byWarehouse(warehouse._id);
        return list.length;
      },
      enabled: Boolean(warehouse._id),
      staleTime: 60_000,
    })),
  });

  const articleCountById = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((warehouse, index) => {
      const result = articleCounts[index];
      map[warehouse._id] = result?.data ?? 0;
    });
    return map;
  }, [articleCounts, filtered]);

  const totalArticles = Object.values(articleCountById).reduce((acc, count) => acc + count, 0);
  const withCoordinates = filtered.filter(
    (warehouse) => typeof warehouse.latitude === "number" && typeof warehouse.longitude === "number",
  ).length;

  const selected: Warehouse | null = useMemo(
    () => (selectedId ? warehouses.data?.find((w) => w._id === selectedId) || null : null),
    [warehouses.data, selectedId],
  );

  const refreshWarehouses = () => {
    queryClient.invalidateQueries({ queryKey: ["warehouses", companyId] });
  };

  const updateWarehouse = useMutation({
    mutationFn: (payload: { id: string; name: string; location?: string }) =>
      warehouseService.update(payload.id, { name: payload.name, location: payload.location }),
    onSuccess: () => {
      toast.success("Warehouse updated");
      refreshWarehouses();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update warehouse"),
  });

  const deleteWarehouse = useMutation({
    mutationFn: (id: string) => warehouseService.delete(id),
    onSuccess: () => {
      toast.success("Warehouse deleted");
      setSelectedId(null);
      setSheetOpen(false);
      refreshWarehouses();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not delete warehouse"),
  });

  const editWarehouse = (warehouse: Warehouse) => {
    const name = window.prompt("Warehouse name", warehouse.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Warehouse name is required");
      return;
    }
    const location = window.prompt("Location label", warehouse.location || "");
    if (location === null) return;
    updateWarehouse.mutate({ id: warehouse._id, name: trimmed, location });
  };

  const removeWarehouse = (warehouse: Warehouse) => {
    const confirmed = window.confirm(`Delete ${warehouse.name}? This will also delete its articles if no inventories exist.`);
    if (confirmed) deleteWarehouse.mutate(warehouse._id);
  };

  if (!companyId) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Warehouses"
          title="Warehouses"
          description="Manage your physical sites, articles, and CSV imports."
        />
        <Notice tone="warn" title="Account not linked to a company">
          Ask a SuperAdmin to assign your account to a company before creating warehouses.
        </Notice>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Warehouses"
        title="Sites & catalogs"
        description="Pin physical locations on the map, import article catalogs, and keep every site healthy."
        actions={<WarehouseCreateDialog companyId={companyId} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          label="Warehouses"
          value={filtered.length}
          icon={<WarehouseIcon className="size-4" />}
        />
        <SummaryStat label="Articles" value={totalArticles} icon={<LayoutGrid className="size-4" />} />
        <SummaryStat label="Map-pinned" value={`${withCoordinates}/${filtered.length}`} icon={<MapPinned className="size-4" />} />
      </div>

      <Tabs defaultValue="grid">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="size-4" /> Grid
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPinned className="size-4" /> Map
            </TabsTrigger>
          </TabsList>
          <div className="relative ml-auto w-72 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search warehouses…"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <TabsContent value="grid">
          {warehouses.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={WarehouseIcon}
              title="No warehouses yet"
              body="Create your first warehouse to start importing articles and running inventories."
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.04 },
                },
              }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((warehouse) => (
                <motion.div
                  key={warehouse._id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <WarehouseCard
                    warehouse={warehouse}
                    articleCount={articleCountById[warehouse._id]}
                    selected={selectedId === warehouse._id}
                    onClick={() => {
                      setSelectedId(warehouse._id);
                      setSheetOpen(true);
                    }}
                    onView={() => {
                      setSelectedId(warehouse._id);
                      setSheetOpen(true);
                    }}
                    onEdit={() => editWarehouse(warehouse)}
                    onDelete={() => removeWarehouse(warehouse)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Warehouse network</CardTitle>
                  <CardDescription>
                    Click any pin to inspect the warehouse and its articles.
                  </CardDescription>
                </div>
                <Badge tone="ai">{withCoordinates} pinned</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WarehouseMap
                warehouses={filtered}
                selectedId={selectedId || undefined}
                onSelect={(id) => {
                  setSelectedId(id);
                  setSheetOpen(true);
                }}
                height={420}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WarehouseDetailSheet
        warehouse={selected}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedId(null);
        }}
      />
    </section>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-indigo/15 text-primary">
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
