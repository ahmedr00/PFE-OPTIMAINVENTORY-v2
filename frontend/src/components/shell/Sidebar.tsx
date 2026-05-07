import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { Badge } from "@/components/ui/Badge";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/domain";
import { visibleNavGroups, type NavItem } from "./nav";

const SIDEBAR_WIDTH = 264;
const SIDEBAR_COLLAPSED = 76;

export function Sidebar({
  role,
  route,
  navigate,
}: {
  role: Role;
  route: string;
  navigate: (path: string) => void;
}) {
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggle = useUIStore((state) => state.toggleSidebar);
  const setCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const groups = visibleNavGroups(role);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setCollapsed]);

  const isActive = (item: NavItem) => {
    if (route === item.route) return true;
    if (item.route === "inventories" && route === "inventory-detail") return true;
    return false;
  };

  return (
    <motion.aside
      aria-label="Primary navigation"
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-surface/70 backdrop-blur-xl lg:flex",
      )}
    >
      <div className="relative flex h-16 items-center justify-between gap-2 px-4">
        <button
          onClick={() => navigate("/app")}
          aria-label="Go to Optima Inventory dashboard"
          className="flex items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-surface-elevated"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-indigo text-white shadow-[0_8px_24px_-8px_rgb(var(--primary)/0.6)]">
            <Package className="size-4" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col text-left"
              >
                <span className="text-sm font-bold leading-tight tracking-tight">Optima</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Inventory
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-5">
          {groups.map((group) => (
            <li key={group.label}>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  const button = (
                    <button
                      key={item.route}
                      onClick={() => navigate(item.path)}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-indigo"
                          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-[18px] shrink-0 transition-transform",
                          active ? "text-primary" : "group-hover:scale-110",
                        )}
                      />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-1 items-center justify-between gap-2 truncate"
                          >
                            <span className="truncate">{item.label}</span>
                            {item.badge === "ai" && (
                              <Badge tone="ai" className="px-1.5 py-0 text-[9px]">
                                AI
                              </Badge>
                            )}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.route}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return button;
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
