import {
  LayoutDashboard,
  Building2,
  Warehouse,
  ClipboardList,
  Boxes,
  Sparkles,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/domain";

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavItem = {
  route: string;
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: "ai" | "new";
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operate",
    items: [
      {
        route: "dashboard",
        label: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
        roles: ["SuperAdmin", "Admin", "Gestionnaire", "CompanyOwner"],
      },
      {
        route: "warehouses",
        label: "Warehouses",
        path: "/app/warehouses",
        icon: Warehouse,
        roles: ["Admin", "Gestionnaire", "CompanyOwner"],
      },
      {
        route: "articles",
        label: "Articles",
        path: "/app/articles",
        icon: Boxes,
        roles: ["Admin", "Gestionnaire", "CompanyOwner"],
      },
      {
        route: "inventories",
        label: "Inventories",
        path: "/app/inventories",
        icon: ClipboardList,
        roles: ["Admin", "Gestionnaire", "CompanyOwner"],
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        route: "reports",
        label: "AI Reports",
        path: "/app/reports",
        icon: Sparkles,
        roles: ["Admin", "Gestionnaire", "CompanyOwner"],
        badge: "ai",
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        route: "companies",
        label: "Companies",
        path: "/app/companies",
        icon: Building2,
        roles: ["SuperAdmin"],
      },
      {
        route: "users",
        label: "Users",
        path: "/app/users",
        icon: Users,
        roles: ["Admin", "CompanyOwner", "SuperAdmin"],
      },
      {
        route: "settings",
        label: "Settings",
        path: "/app/settings",
        icon: Settings,
        roles: [
          "SuperAdmin",
          "Admin",
          "Gestionnaire",
          "CompanyOwner",
          "Compteur",
          "InventoryPersonnel",
        ],
      },
    ],
  },
];

export function visibleNavGroups(role: Role) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}
