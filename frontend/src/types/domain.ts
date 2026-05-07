export type Role =
  | "Admin"
  | "Gestionnaire"
  | "Compteur"
  | "SuperAdmin"
  | "CompanyOwner"
  | "InventoryPersonnel";

export type User = {
  _id: string;
  name?: string;
  email: string;
  role: Role;
  companyId?: string | null;
  createdAt?: string;
  lastLogin?: string | null;
};

export type Company = {
  _id: string;
  name: string;
  legalName?: string;
};

export type Warehouse = {
  _id: string;
  companyId?: string;
  name: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type Article = {
  _id: string;
  warehouseId?: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  barcode?: string;
  unit?: string;
  unitPrice?: number;
  theoreticalQuantity?: number;
  stock?: number;
  countedQuantity?: number | null;
};

export type Inventory = {
  _id: string;
  companyId: string;
  warehouseId: string;
  name: string;
  inventoryDate?: string;
  status: "Open" | "In Progress" | "Closed";
  assignedCounterId?: string | User | null;
};

export type TrialRequest = {
  _id: string;
  companyName: string;
  legalName?: string;
  adminName: string;
  email: string;
  phone?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  companyId?: string | null;
  adminUserId?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
};

export type Sheet = {
  _id: string;
  name: string;
  description?: string;
  status: "draft" | "pending" | "in_progress" | "completed" | "validated";
  compteur1?: string;
  compteur2?: string;
  assignedCompteurs?: string[];
};

export type ComparisonReport = {
  inventory: Inventory;
  technical?: {
    _id: string;
    inventoryId: string;
    uploadedFile?: string;
    uploadedAt?: string;
  } | null;
  comparison?: {
    _id: string;
    inventoryId: string;
    articleId: string;
    technicalQty: number;
    count1Qty: number;
    count2Qty: number;
    count3Qty: number;
    finalQty: number;
  } | null;
};

export type AIInsights = {
  provider: string;
  model: string;
  insights: {
    summary: string;
    topAnomalies: string[];
    recommendedActions: string[];
  };
};

export type AIStats = {
  filters?: {
    companyId?: string | null;
    warehouseId?: string | null;
    inventoryId?: string | null;
  };
  totals?: {
    sheets?: number;
    inventories?: number;
    articles?: number;
    comparisons?: number;
  };
  statusCounts?: {
    conform?: number;
    missing?: number;
    excess?: number;
    pending?: number;
    counted?: number;
  };
  varianceTotals?: {
    missingQuantity?: number;
    excessQuantity?: number;
    absoluteVariance?: number;
    inventoryValueVariance?: number;
  };
  source?: string;
  generatedAt?: string;
};

export type DashboardAnalytics = {
  scope: "platform" | "company";
  totals: {
    companies: number;
    pendingRequests: number;
    admins: number;
    counters: number;
    warehouses: number;
    inventories: number;
    activeInventories: number;
    closedInventories: number;
    comparisons: number;
    discrepancies: number;
    accuracy: number;
    variance: number;
  };
  statusCounts: NonNullable<AIStats["statusCounts"]>;
  trend: { name: string; accuracy: number; variance: number }[];
  activity: number[];
  warehouseBars: { name: string; articles: number; variance: number }[];
  recentInventories: Inventory[];
  generatedAt: string;
};

export type Notification = {
  _id: string;
  recipientId?: string | null;
  recipientRole?: Role | null;
  companyId?: string | null;
  title: string;
  body?: string;
  type: "trial_request" | "count_completed" | "system";
  entityType?: string;
  entityId?: string | null;
  href?: string;
  readAt?: string | null;
  createdAt?: string;
};

export type RouteContext = {
  route: string;
  params: Record<string, string>;
  navigate: (path: string) => void;
};
