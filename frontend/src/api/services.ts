import { api, apiForm, toQueryString } from "./client";
import type {
  AIInsights,
  AIStats,
  Article,
  Company,
  ComparisonReport,
  DashboardAnalytics,
  Inventory,
  Notification,
  Sheet,
  TrialRequest,
  User,
  Warehouse,
} from "../types/domain";

export const authService = {
  check: () => api<{ user: User }>("/api/auth/check-auth"),
  login: (email: string, password: string) =>
    api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  createFirstUser: (payload: { name: string; email: string; password: string; role: string }) =>
    api<{ user: User }>("/api/auth/create-user", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    api<{ message: string; token?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    api<{ message: string }>(`/api/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};

export const companyService = {
  list: () => api<Company[]>("/api/company"),
  create: (payload: Pick<Company, "name" | "legalName">) =>
    api<Company>("/api/company", { method: "POST", body: JSON.stringify(payload) }),
  delete: (id: string) => api(`/api/company/${id}`, { method: "DELETE" }),
};

export const userService = {
  list: () => api<{ users: User[] }>("/api/users/get-users"),
  counters: () => api<User[]>("/api/users/get-counters"),
  create: (payload: { name: string; email: string; role: string }) =>
    api<User & { temporaryPassword?: string }>("/api/users/create-user", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  delete: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
};

export const settingsService = {
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api<{ success: boolean; message: string }>("/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const trialRequestService = {
  create: (payload: {
    companyName: string;
    legalName?: string;
    adminName: string;
    email: string;
    phone?: string;
    message?: string;
  }) =>
    api<{ request: TrialRequest }>("/api/trial-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  list: (status?: string) =>
    api<{ requests: TrialRequest[] }>(`/api/trial-requests${status ? `?status=${status}` : ""}`),
  approve: (
    id: string,
    payload?: {
      companyName: string;
      legalName?: string;
      adminName: string;
      email: string;
    },
  ) =>
    api<{ request: TrialRequest; company: Company; admin: User; temporaryPassword?: string }>(`/api/trial-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
  reject: (id: string) =>
    api<{ request: TrialRequest }>(`/api/trial-requests/${id}/reject`, { method: "POST" }),
};

export const warehouseService = {
  byCompany: (companyId: string) =>
    api<Warehouse[]>(`/api/warehouse/warehouses/company/${companyId}`),
  create: (payload: { companyId: string; name: string; location?: string }) =>
    api<Warehouse>("/api/warehouse/warehouses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createWithArticles: (payload: {
    name: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    file?: File | null;
  }) => {
    const form = new FormData();
    form.append("name", payload.name);
    if (payload.location) form.append("location", payload.location);
    if (typeof payload.latitude === "number") form.append("latitude", String(payload.latitude));
    if (typeof payload.longitude === "number") form.append("longitude", String(payload.longitude));
    if (payload.file) form.append("file", payload.file);
    return apiForm<{ warehouse: Warehouse; imported: number; upserted: number; modified: number }>(
      "/api/warehouse/warehouses/with-articles",
      form,
    );
  },
  update: (
    id: string,
    payload: { name: string; location?: string; latitude?: number | null; longitude?: number | null },
  ) =>
    api<Warehouse>(`/api/warehouse/warehouses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  delete: (id: string) => api<{ message: string }>(`/api/warehouse/warehouses/${id}`, { method: "DELETE" }),
};

export const articleService = {
  byWarehouse: (warehouseId: string) =>
    api<Article[]>(`/api/article/articles/warehouse/${warehouseId}`),
  create: (payload: Partial<Article>) =>
    api<Article>("/api/article/articles", { method: "POST", body: JSON.stringify(payload) }),
  importCsv: (warehouseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiForm<{ imported: number; upserted: number; modified: number }>(
      `/api/article/warehouses/${warehouseId}/import-csv`,
      form,
    );
  },
};

export const inventoryService = {
  byCompany: (companyId: string) => api<Inventory[]>(`/api/inventory/company/${companyId}`),
  byWarehouse: (warehouseId: string) =>
    api<Inventory[]>(`/api/inventory/warehouse/${warehouseId}`),
  create: (payload: Pick<Inventory, "companyId" | "warehouseId" | "name" | "status"> & { assignedCounterId?: string }) =>
    api<Inventory>("/api/inventory", { method: "POST", body: JSON.stringify(payload) }),
  comparison: (inventoryId: string) =>
    api<ComparisonReport>(`/api/inventory/${inventoryId}/comparison`),
  uploadTechnical: (inventoryId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiForm<{ imported: number; matched: number }>(`/api/inventory/${inventoryId}/technical`, form);
  },
};

export const sheetService = {
  list: () => api<{ sheets: Sheet[] }>("/api/sheets/get-sheet"),
  get: (id: string) => api<{ sheet: Sheet }>(`/api/sheets/${id}`),
  create: (payload: Pick<Sheet, "name" | "description" | "status">) =>
    api<{ sheet: Sheet }>("/api/sheets/create-sheet", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  assignCounter: (id: string, compteurName: string) =>
    api<{ sheet: Sheet }>(`/api/sheets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ compteurName }),
    }),
};

export const aiService = {
  reportInsights: (filters: { companyId?: string; warehouseId?: string; inventoryId?: string } = {}) =>
    api<{ ai: AIInsights; stats: AIStats }>(`/api/ai/report-insights${toQueryString(filters)}`),
};

export const analyticsService = {
  dashboard: (filters: { companyId?: string } = {}) =>
    api<DashboardAnalytics>(`/api/analytics/dashboard${toQueryString(filters)}`),
};

export const notificationService = {
  list: () => api<{ notifications: Notification[]; unreadCount: number }>("/api/notifications"),
  markRead: (id: string) =>
    api<{ notification: Notification }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    api<{ modified: number }>("/api/notifications/read-all", { method: "PATCH" }),
};
