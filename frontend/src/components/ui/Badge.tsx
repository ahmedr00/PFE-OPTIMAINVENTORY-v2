import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      tone: {
        slate: "border-border bg-surface-elevated text-muted-foreground",
        primary: "border-primary/30 bg-primary/15 text-primary",
        emerald: "border-emerald/30 bg-emerald/15 text-emerald",
        green: "border-emerald/30 bg-emerald/15 text-emerald",
        amber: "border-amber/30 bg-amber/15 text-amber",
        crimson: "border-crimson/30 bg-crimson/15 text-crimson",
        red: "border-crimson/30 bg-crimson/15 text-crimson",
        ai: "border-transparent bg-gradient-to-r from-ai-from to-ai-to text-white shadow-[0_4px_12px_-4px_rgb(var(--ai-from)/0.6)]",
        indigo: "border-indigo/30 bg-indigo/15 text-indigo",
        blue: "border-primary/30 bg-primary/15 text-primary",
        outline: "border-border-strong bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      tone: "slate",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
