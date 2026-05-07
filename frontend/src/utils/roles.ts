import type { Role } from "../types/domain";

export const adminRoles: Role[] = ["Admin", "Gestionnaire", "CompanyOwner"];
export const counterRoles: Role[] = ["Compteur", "InventoryPersonnel"];

export function isAdminRole(role: Role) {
  return adminRoles.includes(role);
}

export function isCounterRole(role: Role) {
  return counterRoles.includes(role);
}

export function displayRole(role: Role) {
  if (role === "CompanyOwner") return "Admin";
  if (role === "InventoryPersonnel") return "Compteur";
  return role;
}
