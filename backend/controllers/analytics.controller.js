import { Article } from "../models/article.model.js";
import { Company } from "../models/company.model.js";
import { ComparisonResult } from "../models/comparison.model.js";
import { Inventory } from "../models/inventory.model.js";
import { TrialRequest } from "../models/trialRequest.model.js";
import { User } from "../models/user.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { isSuperAdmin, requireCompanyScope } from "../utils/scope.js";

const adminRoles = ["Admin", "Gestionnaire", "CompanyOwner"];
const counterRoles = ["Compteur", "InventoryPersonnel"];

const startOfWeek = (date) => {
  const value = new Date(date);
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1);
  value.setDate(diff);
  value.setHours(0, 0, 0, 0);
  return value;
};

const weekLabel = (date) => {
  const start = startOfWeek(date);
  const oneJan = new Date(start.getFullYear(), 0, 1);
  const week = Math.ceil(((start - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
  return `W${week}`;
};

const comparisonStatus = (comparison) => {
  const diff = (comparison.finalQty || 0) - (comparison.technicalQty || 0);
  if (diff < 0) return "missing";
  if (diff > 0) return "excess";
  return "conform";
};

const emptyStatusCounts = () => ({ conform: 0, missing: 0, excess: 0, pending: 0, counted: 0 });

const buildStatusCounts = (comparisons) => {
  const statusCounts = emptyStatusCounts();
  for (const comparison of comparisons) {
    statusCounts[comparisonStatus(comparison)] += 1;
  }
  return statusCounts;
};

const buildTrend = ({ inventories, comparisons, weeks = 8 }) => {
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const date = startOfWeek(new Date());
    date.setDate(date.getDate() - (weeks - index - 1) * 7);
    return {
      key: date.toISOString().slice(0, 10),
      name: weekLabel(date),
      conform: 0,
      compared: 0,
      variance: 0,
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const inventoryById = new Map(inventories.map((inventory) => [inventory._id.toString(), inventory]));

  for (const comparison of comparisons) {
    const inventory = inventoryById.get(comparison.inventoryId.toString());
    if (!inventory) continue;
    const key = startOfWeek(inventory.inventoryDate || inventory.updatedAt || inventory.createdAt).toISOString().slice(0, 10);
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;
    const diff = (comparison.finalQty || 0) - (comparison.technicalQty || 0);
    bucket.compared += 1;
    bucket.variance += Math.abs(diff);
    if (diff === 0) bucket.conform += 1;
  }

  return buckets.map((bucket) => ({
    name: bucket.name,
    accuracy: bucket.compared ? Math.round((bucket.conform / bucket.compared) * 1000) / 10 : 0,
    variance: bucket.variance,
  }));
};

const buildActivity = ({ inventories, cells = 84 }) => {
  const counts = Array.from({ length: cells }, () => 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const inventory of inventories) {
    const date = new Date(inventory.updatedAt || inventory.inventoryDate || inventory.createdAt);
    date.setHours(0, 0, 0, 0);
    const index = cells - 1 - Math.floor((today - date) / 86400000);
    if (index >= 0 && index < cells) counts[index] += 1;
  }
  const max = Math.max(1, ...counts);
  return counts.map((count) => count / max);
};

const buildWarehouseBars = async ({ companyId, warehouses, comparisons }) => {
  const articles = await Article.find({ ...(companyId ? { companyId } : {}) }).select("warehouseId").lean();
  const articlesByWarehouse = new Map();
  for (const article of articles) {
    const key = article.warehouseId?.toString();
    if (!key) continue;
    articlesByWarehouse.set(key, (articlesByWarehouse.get(key) || 0) + 1);
  }
  const inventoryIdsByWarehouse = new Map();
  const inventories = await Inventory.find({ ...(companyId ? { companyId } : {}) }).select("_id warehouseId").lean();
  for (const inventory of inventories) {
    const key = inventory.warehouseId.toString();
    const list = inventoryIdsByWarehouse.get(key) || [];
    list.push(inventory._id.toString());
    inventoryIdsByWarehouse.set(key, list);
  }
  const varianceByInventory = new Map();
  for (const comparison of comparisons) {
    const key = comparison.inventoryId.toString();
    const current = varianceByInventory.get(key) || 0;
    varianceByInventory.set(key, current + Math.abs((comparison.finalQty || 0) - (comparison.technicalQty || 0)));
  }

  return warehouses.slice(0, 8).map((warehouse) => {
    const inventoryIds = inventoryIdsByWarehouse.get(warehouse._id.toString()) || [];
    const variance = inventoryIds.reduce((total, id) => total + (varianceByInventory.get(id) || 0), 0);
    return {
      name: warehouse.name.slice(0, 12),
      articles: articlesByWarehouse.get(warehouse._id.toString()) || 0,
      variance,
    };
  });
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const superAdmin = isSuperAdmin(req.user);
    const companyId = superAdmin ? req.query.companyId || null : requireCompanyScope(req, res);
    if (!superAdmin && !companyId) return;

    const scoped = companyId ? { companyId } : {};
    const [
      companiesCount,
      pendingRequestsCount,
      adminsCount,
      countersCount,
      warehouses,
      inventories,
    ] = await Promise.all([
      superAdmin ? Company.countDocuments() : Promise.resolve(0),
      superAdmin ? TrialRequest.countDocuments({ status: "pending" }) : Promise.resolve(0),
      User.countDocuments({ ...(companyId ? { companyId } : {}), role: { $in: adminRoles } }),
      User.countDocuments({ ...(companyId ? { companyId } : {}), role: { $in: counterRoles } }),
      Warehouse.find(scoped).sort({ createdAt: -1 }).lean(),
      Inventory.find(scoped).sort({ updatedAt: -1 }).populate("assignedCounterId", "name email").lean(),
    ]);

    const inventoryIds = inventories.map((inventory) => inventory._id);
    const comparisons = inventoryIds.length
      ? await ComparisonResult.find({ inventoryId: { $in: inventoryIds } }).lean()
      : [];
    const statusCounts = buildStatusCounts(comparisons);
    const compared = statusCounts.conform + statusCounts.missing + statusCounts.excess;
    const accuracy = compared ? Math.round((statusCounts.conform / compared) * 1000) / 10 : 0;
    const variance = comparisons.reduce(
      (total, comparison) => total + Math.abs((comparison.finalQty || 0) - (comparison.technicalQty || 0)),
      0,
    );
    const activeInventories = inventories.filter((inventory) => inventory.status !== "Closed").length;
    const closedInventories = inventories.filter((inventory) => inventory.status === "Closed").length;

    return res.status(200).json({
      scope: superAdmin ? "platform" : "company",
      totals: {
        companies: companiesCount,
        pendingRequests: pendingRequestsCount,
        admins: adminsCount,
        counters: countersCount,
        warehouses: warehouses.length,
        inventories: inventories.length,
        activeInventories,
        closedInventories,
        comparisons: comparisons.length,
        discrepancies: statusCounts.missing + statusCounts.excess,
        accuracy,
        variance,
      },
      statusCounts,
      trend: buildTrend({ inventories, comparisons, weeks: superAdmin ? 12 : 8 }),
      activity: buildActivity({ inventories }),
      warehouseBars: await buildWarehouseBars({ companyId, warehouses, comparisons }),
      recentInventories: inventories.slice(0, 5),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
