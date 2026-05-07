import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { Badge } from "@/components/ui/Badge";
import { useUIStore } from "@/store/ui";
import { aiService } from "@/api/services";
import type { AIInsights, AIStats, User } from "@/types/domain";

export function AIAssistantTrigger() {
  const setOpen = useUIStore((state) => state.setAIAssistantOpen);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="ai-gradient relative flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-bold text-white shadow-[0_8px_24px_-8px_rgb(var(--ai-from)/0.55)] transition-transform hover:scale-[1.02]"
        >
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
            New
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Optima AI assistant</TooltipContent>
    </Tooltip>
  );
}

export function AIAssistantSheet({ user }: { user: User }) {
  const open = useUIStore((state) => state.aiAssistantOpen);
  const setOpen = useUIStore((state) => state.setAIAssistantOpen);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    aiService
      .reportInsights({ companyId: user.companyId || undefined })
      .then((data) => {
        if (cancelled) return;
        setInsights(data.ai);
        setStats(data.stats);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not fetch AI insights");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user.companyId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border bg-gradient-to-br from-ai-from/10 via-surface to-indigo/10">
          <div className="flex items-center gap-3">
            <span className="ai-gradient flex size-10 items-center justify-center rounded-xl text-white shadow-lg">
              <Wand2 className="size-5" />
            </span>
            <div>
              <SheetTitle className="ai-text">Optima AI Assistant</SheetTitle>
              <SheetDescription>Operational insights tuned to your company</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Analysing your inventory data…
            </div>
          )}

          {error && (
            <div className="rounded-md border border-crimson/30 bg-crimson/10 p-3 text-sm text-crimson">
              {error}
            </div>
          )}

          {!loading && !error && insights && (
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone="ai">Summary</Badge>
                  <Badge tone="outline" className="text-[10px]">
                    {insights.provider} • {insights.model}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {insights.insights.summary}
                </p>
              </motion.div>

              {insights.insights.topAnomalies?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Anomalies detected
                  </p>
                  <ul className="flex flex-col gap-2">
                    {insights.insights.topAnomalies.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-amber/20 bg-amber/5 p-2.5 text-sm text-foreground/90"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {insights.insights.recommendedActions?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recommended actions
                  </p>
                  <ul className="flex flex-col gap-2">
                    {insights.insights.recommendedActions.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-emerald/25 bg-emerald/5 p-2.5 text-sm text-foreground/90"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {stats && (
                <div className="grid grid-cols-3 gap-2">
                  <KpiPill label="Conform" value={stats.statusCounts?.conform || 0} tone="emerald" />
                  <KpiPill label="Missing" value={stats.statusCounts?.missing || 0} tone="amber" />
                  <KpiPill label="Excess" value={stats.statusCounts?.excess || 0} tone="crimson" />
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KpiPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "crimson";
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-3 text-center">
      <p className={`text-xl font-bold tabular text-${tone}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
