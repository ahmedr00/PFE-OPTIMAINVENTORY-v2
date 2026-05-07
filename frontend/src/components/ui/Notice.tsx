import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  success: { Icon: CheckCircle2, classes: "border-emerald/30 bg-emerald/10 text-emerald" },
  error: { Icon: AlertCircle, classes: "border-crimson/30 bg-crimson/10 text-crimson" },
  warn: { Icon: AlertTriangle, classes: "border-amber/30 bg-amber/10 text-amber" },
  info: { Icon: Info, classes: "border-primary/30 bg-primary/10 text-primary" },
} as const;

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { Icon, classes } = tones[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
        classes,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {children && <p className="leading-snug opacity-90">{children}</p>}
      </div>
    </div>
  );
}
