import { Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function BrandHeader({
  navigate,
  showBadge = true,
}: {
  navigate?: (path: string) => void;
  showBadge?: boolean;
}) {
  const Wrapper: React.ElementType = navigate ? "button" : "div";
  return (
    <div className="flex items-center justify-between">
      <Wrapper
        type={navigate ? "button" : undefined}
        onClick={navigate ? () => navigate("/") : undefined}
        className="flex items-center gap-2.5 text-left"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo text-white shadow-[0_8px_24px_-8px_rgb(var(--primary)/0.6)]">
          <Package className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-white">Optima</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Inventory
          </p>
        </div>
      </Wrapper>
      {showBadge && (
        <Badge tone="ai" className="hidden sm:inline-flex">
          <Package className="size-3" /> Warehouse-ready
        </Badge>
      )}
    </div>
  );
}
