import { Command } from "cmdk";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  Warehouse,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useUIStore } from "@/store/ui";
import { inventoryService, warehouseService } from "@/api/services";
import { isAdminRole } from "@/utils/roles";
import { cn } from "@/lib/cn";
import type { User } from "@/types/domain";

export function CommandPalette({
  user,
  navigate,
}: {
  user: User;
  navigate: (path: string) => void;
}) {
  const open = useUIStore((state) => state.cmdkOpen);
  const setOpen = useUIStore((state) => state.setCmdkOpen);
  const setAIAssistantOpen = useUIStore((state) => state.setAIAssistantOpen);
  const isAdmin = isAdminRole(user.role);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!useUIStore.getState().cmdkOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const warehouses = useQuery({
    queryKey: ["warehouses", user.companyId],
    queryFn: () => warehouseService.byCompany(user.companyId!),
    enabled: open && isAdmin && Boolean(user.companyId),
  });
  const inventories = useQuery({
    queryKey: ["inventories", user.companyId],
    queryFn: () => inventoryService.byCompany(user.companyId!),
    enabled: open && isAdmin && Boolean(user.companyId),
  });

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const navigationItems = useMemo(() => {
    const items: { label: string; path: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string }[] = [];
    if (user.role === "SuperAdmin") {
      items.push({ label: "Dashboard", path: "/app", icon: LayoutDashboard, shortcut: "G D" });
      items.push({ label: "Companies", path: "/app/companies", icon: Building2, shortcut: "G C" });
      items.push({ label: "Users", path: "/app/users", icon: Users, shortcut: "G U" });
    } else if (isAdmin) {
      items.push({ label: "Dashboard", path: "/app", icon: LayoutDashboard, shortcut: "G D" });
      items.push({ label: "Warehouses", path: "/app/warehouses", icon: Warehouse, shortcut: "G W" });
      items.push({ label: "Articles", path: "/app/articles", icon: Boxes, shortcut: "G A" });
      items.push({ label: "Inventories", path: "/app/inventories", icon: ClipboardList, shortcut: "G I" });
      items.push({ label: "AI Reports", path: "/app/reports", icon: Sparkles, shortcut: "G R" });
      items.push({ label: "Users", path: "/app/users", icon: Users, shortcut: "G U" });
    }
    items.push({ label: "Settings", path: "/app/settings", icon: Settings, shortcut: "G S" });
    return items;
  }, [user.role, isAdmin]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showClose={false}
        className="max-w-xl overflow-hidden p-0 [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search across navigation, warehouses, inventories, and quick actions.
        </DialogDescription>
        <Command label="Command palette" className="flex max-h-[70vh] flex-col">
          <div
            cmdk-input-wrapper=""
            className="flex items-center gap-2 px-4 py-3"
          >
            <Search className="size-4 text-muted-foreground" />
            <Command.Input
              placeholder="Search pages, warehouses, inventories…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="hidden rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <CommandGroup heading="Navigation">
              {navigationItems.map((item) => (
                <CommandItem
                  key={item.path}
                  onSelect={() => go(item.path)}
                  icon={<item.icon className="size-4" />}
                  shortcut={item.shortcut}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {isAdmin && (
              <CommandGroup heading="Quick actions">
                <CommandItem
                  onSelect={() => go("/app/inventories")}
                  icon={<Plus className="size-4" />}
                >
                  New inventory
                </CommandItem>
                <CommandItem
                  onSelect={() => go("/app/warehouses")}
                  icon={<Plus className="size-4" />}
                >
                  New warehouse
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setAIAssistantOpen(true);
                  }}
                  icon={<Sparkles className="size-4 text-ai-from" />}
                >
                  Ask Optima AI
                </CommandItem>
              </CommandGroup>
            )}

            {warehouses.data && warehouses.data.length > 0 && (
              <CommandGroup heading="Warehouses">
                {warehouses.data.slice(0, 8).map((warehouse) => (
                  <CommandItem
                    key={warehouse._id}
                    onSelect={() => go(`/app/warehouses`)}
                    icon={<Warehouse className="size-4" />}
                  >
                    <div className="flex flex-col">
                      <span>{warehouse.name}</span>
                      {warehouse.location && (
                        <span className="text-[11px] text-muted-foreground">
                          {warehouse.location}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {inventories.data && inventories.data.length > 0 && (
              <CommandGroup heading="Inventories">
                {inventories.data.slice(0, 8).map((inventory) => (
                  <CommandItem
                    key={inventory._id}
                    onSelect={() => go(`/app/inventories/${inventory._id}`)}
                    icon={<ClipboardList className="size-4" />}
                  >
                    <div className="flex flex-col">
                      <span>{inventory.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Status: {inventory.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command.List>
          <div className="flex items-center justify-between border-t border-border bg-surface-elevated/50 px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              Tip: press{" "}
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 text-[10px] font-bold">
                ⌘K
              </kbd>{" "}
              anywhere to open this palette
            </span>
            <span className="ai-text font-bold">Optima AI</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Command.Group
      heading={heading}
      className={cn(
        "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5",
        "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground",
      )}
    >
      {children}
    </Command.Group>
  );
}

function CommandItem({
  onSelect,
  icon,
  shortcut,
  children,
}: {
  onSelect: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
        "data-[selected=true]:bg-surface-elevated data-[selected=true]:text-foreground",
      )}
    >
      {icon && (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-muted-foreground">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {shortcut}
        </span>
      )}
    </Command.Item>
  );
}
