import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin, Search, Upload } from "lucide-react";
import { articleService } from "@/api/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { CSVDropzone, type CSVPreview } from "@/components/csv/CSVDropzone";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNumber } from "@/lib/format";
import type { Warehouse } from "@/types/domain";

const ARTICLE_COLUMNS = [
  "code",
  "name",
  "barcode",
  "location",
  "theoreticalQuantity",
  "unitPrice",
  "category",
  "unit",
];

export function WarehouseDetailSheet({
  warehouse,
  open,
  onOpenChange,
}: {
  warehouse: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);

  const queryClient = useQueryClient();
  const articles = useQuery({
    queryKey: ["articles", warehouse?._id],
    queryFn: () => articleService.byWarehouse(warehouse!._id),
    enabled: open && Boolean(warehouse?._id),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!warehouse) throw new Error("No warehouse selected");
      return articleService.importCsv(warehouse._id, file);
    },
    onSuccess: (result) => {
      toast.success(`${result.imported} rows imported`, {
        description: `${result.upserted} new, ${result.modified} updated`,
      });
      queryClient.invalidateQueries({ queryKey: ["articles", warehouse?._id] });
      setCsvFile(null);
      setCsvPreview(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not import CSV");
    },
  });

  const filtered = (articles.data || []).filter((article) => {
    if (!search.trim()) return true;
    const lower = search.toLowerCase();
    return (
      article.code.toLowerCase().includes(lower) ||
      article.name.toLowerCase().includes(lower) ||
      (article.barcode || "").toLowerCase().includes(lower)
    );
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle className="truncate">{warehouse?.name || "Warehouse"}</SheetTitle>
              <SheetDescription className="flex items-center gap-1">
                <MapPin className="size-3" /> {warehouse?.location || "No location set"}
              </SheetDescription>
            </div>
            <Badge tone="emerald">Active</Badge>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Articles" value={formatNumber(articles.data?.length || 0)} />
            <Stat
              label="Theoretical"
              value={formatNumber(
                (articles.data || []).reduce(
                  (sum, article) => sum + (article.theoreticalQuantity || 0),
                  0,
                ),
              )}
            />
            <Stat
              label="Categories"
              value={
                new Set((articles.data || []).map((article) => article.category || "—")).size || 0
              }
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Import articles
            </p>
            <CSVDropzone
              file={csvFile}
              onFileChange={(file, preview) => {
                setCsvFile(file);
                setCsvPreview(preview);
              }}
              expectedColumns={ARTICLE_COLUMNS}
              description="CSV columns: code, name, barcode, location, theoreticalQuantity…"
            />
            {csvFile && (
              <Button
                className="mt-2 w-full"
                variant="ai"
                onClick={() => upload.mutate(csvFile)}
                disabled={upload.isPending}
              >
                {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Import {csvPreview ? `${csvPreview.rowCount} rows` : ""}
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Articles
              </p>
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search articles…"
                  className="h-9 pl-9"
                />
              </div>
            </div>

            {articles.isLoading && <Skeleton className="h-40 w-full" />}
            {!articles.isLoading && filtered.length === 0 ? (
              <EmptyState
                title="No articles yet"
                body="Import a CSV to fill this warehouse with articles."
              />
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-elevated/60">
                    <tr>
                      <Th>Code</Th>
                      <Th>Name</Th>
                      <Th>Location</Th>
                      <Th align="right">Theoretical</Th>
                      <Th align="right">Price</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((article) => (
                      <tr
                        key={article._id}
                        className="border-t border-border/60 transition-colors hover:bg-surface-elevated/60"
                      >
                        <Td className="font-mono text-[11px]">{article.code}</Td>
                        <Td className="font-medium">{article.name}</Td>
                        <Td className="text-muted-foreground">{article.location || "—"}</Td>
                        <Td align="right" className="tabular">
                          {formatNumber(article.theoreticalQuantity ?? article.stock ?? 0)}
                        </Td>
                        <Td align="right" className="tabular text-muted-foreground">
                          {article.unitPrice ? article.unitPrice.toFixed(2) : "—"}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > 50 && (
                  <div className="border-t border-border bg-surface-elevated/40 px-3 py-2 text-center text-xs text-muted-foreground">
                    Showing first 50 of {filtered.length} articles
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular">{value}</p>
    </div>
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
      className={`whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`whitespace-nowrap px-3 py-2 ${align === "right" ? "text-right" : "text-left"} ${className || ""}`}
    >
      {children}
    </td>
  );
}
