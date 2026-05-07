import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Badge } from "@/components/ui/Badge";
import { companyService } from "@/api/services";
import { cn } from "@/lib/cn";
import type { User } from "@/types/domain";

export function CompanySwitcher({ user }: { user: User }) {
  const isSuperAdmin = user.role === "SuperAdmin";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(user.companyId ?? null);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: companyService.list,
    enabled: isSuperAdmin,
  });

  const current = useMemo(() => {
    if (!isSuperAdmin) return null;
    return companies.find((company) => company._id === selected) || companies[0];
  }, [companies, selected, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 px-3 py-1.5 md:flex">
        <Building2 className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground/90">
          {user.companyId ? "Company workspace" : "Unassigned"}
        </span>
        <Badge tone={user.companyId ? "emerald" : "amber"} className="px-1.5 py-0 text-[9px]">
          {user.companyId ? "Live" : "Pending"}
        </Badge>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="hidden h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 px-2.5 pr-2 text-xs font-semibold transition-colors hover:bg-surface-elevated md:flex"
          aria-label="Switch company"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-indigo text-[10px] font-bold text-white">
            {(current?.name || "OI").slice(0, 2).toUpperCase()}
          </span>
          <span className="max-w-[140px] truncate">{current?.name || "All companies"}</span>
          <ChevronsUpDown className="size-3.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1.5">
        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Companies
        </div>
        <div className="max-h-72 overflow-y-auto">
          {companies.length === 0 && (
            <p className="px-2.5 py-3 text-xs text-muted-foreground">No companies yet.</p>
          )}
          {companies.map((company) => {
            const isSelected = current?._id === company._id;
            return (
              <button
                key={company._id}
                onClick={() => {
                  setSelected(company._id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-elevated",
                  isSelected && "bg-surface-elevated",
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-indigo text-[10px] font-bold text-white">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 truncate">
                  <p className="truncate font-medium">{company.name}</p>
                  {company.legalName && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {company.legalName}
                    </p>
                  )}
                </div>
                {isSelected && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
