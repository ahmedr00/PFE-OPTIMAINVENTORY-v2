import { motion } from "framer-motion";
import { Boxes, Edit3, MapPin, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/cn";
import type { Warehouse } from "@/types/domain";

export function WarehouseCard({
  warehouse,
  articleCount,
  health,
  selected,
  onClick,
  onView,
  onEdit,
  onDelete,
}: {
  warehouse: Warehouse;
  articleCount?: number;
  health?: number;
  selected?: boolean;
  onClick?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const computedHealth = typeof health === "number" ? health : 80 + ((articleCount || 0) % 18);
  const tone =
    computedHealth >= 92 ? "emerald" : computedHealth >= 78 ? "primary" : "amber";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick?.();
      }}
      className={cn(
        "cursor-pointer",
        "group relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] transition-colors",
        selected && "border-primary bg-primary/5 ring-2 ring-primary/30",
      )}
    >
      <div className="absolute -right-10 -top-10 size-24 rounded-full bg-gradient-to-br from-primary/15 to-indigo/10 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-indigo/20 text-primary">
            <Boxes className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{warehouse.name}</p>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" />
              <span className="truncate">{warehouse.location || "No location"}</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-surface-elevated hover:text-foreground group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
              aria-label="Warehouse actions"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onClick={onView}>
              <Boxes className="size-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit3 className="size-4" /> Edit warehouse
            </DropdownMenuItem>
            <DropdownMenuItem className="text-crimson focus:text-crimson" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete warehouse
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border bg-surface-elevated/60 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Articles</p>
          <p className="mt-0.5 text-lg font-bold tabular">{articleCount ?? "—"}</p>
        </div>
        <div className="rounded-md border border-border bg-surface-elevated/60 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Health</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  tone === "emerald"
                    ? "bg-emerald"
                    : tone === "primary"
                      ? "bg-primary"
                      : "bg-amber",
                )}
                style={{ width: `${Math.min(100, Math.max(0, computedHealth))}%` }}
              />
            </div>
            <span className="text-xs font-bold tabular text-foreground/80">
              {Math.round(computedHealth)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between">
        <Badge tone={tone}>
          {tone === "emerald" ? "Healthy" : tone === "primary" ? "Stable" : "Watch"}
        </Badge>
        {warehouse.latitude !== undefined &&
          warehouse.latitude !== null &&
          warehouse.longitude !== undefined &&
          warehouse.longitude !== null && (
            <span className="text-[10px] text-muted-foreground tabular">
              {warehouse.latitude?.toFixed(2)}, {warehouse.longitude?.toFixed(2)}
            </span>
          )}
      </div>
    </motion.div>
  );
}
