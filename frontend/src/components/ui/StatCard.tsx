import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "emerald" | "amber" | "crimson" | "ai";
  className?: string;
}

const toneStyles = {
  default: "border-border bg-surface",
  primary: "border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface",
  emerald: "border-emerald/30 bg-gradient-to-br from-emerald/10 via-surface to-surface",
  amber: "border-amber/30 bg-gradient-to-br from-amber/10 via-surface to-surface",
  crimson: "border-crimson/30 bg-gradient-to-br from-crimson/10 via-surface to-surface",
  ai: "border-transparent text-white bg-gradient-to-br from-ai-from via-indigo to-ai-to shadow-[0_20px_60px_-20px_rgb(var(--ai-from)/0.5)]",
};

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "default",
  className,
}: StatCardProps) {
  const isAi = tone === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-soft)] transition-shadow",
        toneStyles[tone],
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mb-3 inline-flex size-9 items-center justify-center rounded-xl border",
            isAi ? "border-white/30 bg-white/15 text-white" : "border-border bg-surface-elevated text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      )}
      <p className={cn("text-xs font-semibold uppercase tracking-wider", isAi ? "text-white/80" : "text-muted-foreground")}>
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold tracking-tight tabular">{value}</p>
        {typeof delta === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              delta >= 0
                ? isAi
                  ? "text-emerald-200"
                  : "text-emerald"
                : isAi
                ? "text-rose-200"
                : "text-crimson",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {hint && (
        <p className={cn("mt-1.5 text-xs", isAi ? "text-white/75" : "text-muted-foreground")}>{hint}</p>
      )}
    </motion.div>
  );
}
