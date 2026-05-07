import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import {
  Boxes,
  Download,
  Filter,
  Search,
  Sparkles,
  Tag,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import { articleService, warehouseService } from "@/api/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
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
import { DataTable, exportToCsv } from "@/components/data-table/DataTable";
import { formatNumber } from "@/lib/format";
import type { Article, User, Warehouse } from "@/types/domain";

type ArticleRow = Article & { warehouseName: string };

export function ArticlesPage({ user }: { user: User }) {
  const companyId = user.companyId || "";
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const warehouses = useQuery({
    queryKey: ["warehouses", companyId],
    queryFn: () => warehouseService.byCompany(companyId),
    enabled: Boolean(companyId),
  });

  const allArticleQueries = useQueries({
    queries: (warehouses.data || []).map((warehouse) => ({
      queryKey: ["articles", warehouse._id],
      queryFn: () => articleService.byWarehouse(warehouse._id),
      enabled: Boolean(warehouse._id),
      staleTime: 60_000,
    })),
  });

  const articles: ArticleRow[] = useMemo(() => {
    if (!warehouses.data) return [];
    const warehouseById = new Map<string, Warehouse>();
    warehouses.data.forEach((warehouse) => warehouseById.set(warehouse._id, warehouse));
    const out: ArticleRow[] = [];
    allArticleQueries.forEach((result, index) => {
      const warehouse = warehouses.data![index];
      if (!warehouse) return;
      (result.data || []).forEach((article) => {
        out.push({ ...article, warehouseName: warehouse.name });
      });
    });
    return out;
  }, [allArticleQueries, warehouses.data]);

  const isLoading =
    warehouses.isLoading || allArticleQueries.some((query) => query.isLoading && query.fetchStatus !== "idle");

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((article) => {
      if (article.category) set.add(article.category);
    });
    return Array.from(set).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      if (warehouseFilter !== "all" && article.warehouseId !== warehouseFilter) return false;
      if (categoryFilter !== "all" && article.category !== categoryFilter) return false;
      if (search.trim()) {
        const lower = search.toLowerCase();
        return (
          article.code.toLowerCase().includes(lower) ||
          article.name.toLowerCase().includes(lower) ||
          (article.barcode || "").toLowerCase().includes(lower) ||
          (article.location || "").toLowerCase().includes(lower) ||
          article.warehouseName.toLowerCase().includes(lower)
        );
      }
      return true;
    });
  }, [articles, search, warehouseFilter, categoryFilter]);

  const totalValue = useMemo(
    () =>
      filtered.reduce(
        (sum, article) => sum + (article.unitPrice || 0) * (article.theoreticalQuantity || 0),
        0,
      ),
    [filtered],
  );

  const columns: ColumnDef<ArticleRow>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 36,
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground/85">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="text-[11px] text-muted-foreground">
                {row.original.description.slice(0, 64)}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "warehouseName",
        header: "Warehouse",
        cell: ({ row }) => (
          <Badge tone="primary" className="font-medium">
            <WarehouseIcon className="size-3" />
            {row.original.warehouseName}
          </Badge>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.category || "—"}</span>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.location || "—"}</span>
        ),
      },
      {
        accessorKey: "barcode",
        header: "Barcode",
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.barcode || "—"}
          </span>
        ),
      },
      {
        accessorKey: "theoreticalQuantity",
        header: () => <span className="block text-right">Qty</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular">
            {formatNumber(row.original.theoreticalQuantity ?? row.original.stock ?? 0)}
          </span>
        ),
      },
      {
        accessorKey: "unitPrice",
        header: () => <span className="block text-right">Price</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular text-muted-foreground">
            {row.original.unitPrice ? row.original.unitPrice.toFixed(2) : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const selectedCount = Object.keys(rowSelection).length;

  if (!companyId) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader eyebrow="Catalog" title="Articles" />
        <Notice tone="warn" title="Account not linked to a company">
          Ask a SuperAdmin to assign your account to a company before browsing articles.
        </Notice>
      </section>
    );
  }

  const exportRows = () => {
    const rows = selectedCount > 0
      ? filtered.filter((_, index) => rowSelection[String(index)])
      : filtered;
    exportToCsv("optima-articles.csv", rows, [
      { key: "code", label: "code" },
      { key: "name", label: "name" },
      { key: "barcode", label: "barcode" },
      { key: "category", label: "category" },
      { key: "warehouseName", label: "warehouse" },
      { key: "location", label: "location" },
      { key: "theoreticalQuantity", label: "theoreticalQuantity" },
      { key: "unitPrice", label: "unitPrice" },
      { key: "unit", label: "unit" },
    ]);
  };

  const clearFilters = () => {
    setSearch("");
    setWarehouseFilter("all");
    setCategoryFilter("all");
  };

  const hasFilters = search || warehouseFilter !== "all" || categoryFilter !== "all";

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalog"
        title="Articles"
        description="Browse and export the article catalog across every warehouse in your company."
        actions={
          <Button variant="ai" onClick={exportRows} disabled={filtered.length === 0}>
            <Download className="size-4" />
            Export {selectedCount > 0 ? `${selectedCount} selected` : "all"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          icon={<Boxes className="size-4" />}
          label="Articles"
          value={formatNumber(articles.length)}
          hint={`${filtered.length} after filters`}
        />
        <SummaryStat
          icon={<Tag className="size-4" />}
          label="Categories"
          value={formatNumber(categories.length)}
          hint="Distinct categories"
        />
        <SummaryStat
          icon={<Sparkles className="size-4" />}
          label="Inventory value"
          value={formatNumber(Math.round(totalValue))}
          hint="Sum of theoretical × price"
          accent
        />
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
                  className="h-9 w-64 pl-9"
                  placeholder="Search code, name, barcode…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="h-9 w-44">
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable<ArticleRow, unknown>
              columns={columns}
              data={filtered}
              pageSize={15}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              emptyState={
                <EmptyState
                  icon={Boxes}
                  title="No articles found"
                  body="Adjust your filters or import articles into a warehouse."
                />
              }
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[var(--radius-lg)] border p-4 ${
        accent
          ? "border-transparent bg-gradient-to-br from-ai-from/15 via-indigo/10 to-ai-to/20"
          : "border-border bg-surface"
      } shadow-[var(--shadow-soft)]`}
    >
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${
          accent
            ? "ai-gradient text-white"
            : "bg-gradient-to-br from-primary/15 to-indigo/15 text-primary"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold tabular">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
