import { Article } from "../models/article.model.js";
import { Inventory } from "../models/inventory.model.js";
import { InventoryCount } from "../models/InventoryCount.model.js";
import { InventoryCountItem } from "../models/InventoryCountItem.model.js";
import { TimeTracking } from "../models/TimeTracking.model.js";
import { createNotification } from "./notification.controller.js";

const getInventoryProgress = async ({ inventory, personnelId }) => {
  const articlesCount = await Article.countDocuments({ warehouseId: inventory.warehouseId });
  const session = await InventoryCount.findOne({
    inventoryId: inventory._id,
    assignedPersonnelId: personnelId,
    countNumber: 1,
  }).lean();
  const countedArticles = session
    ? await InventoryCountItem.countDocuments({ inventoryCountId: session._id })
    : 0;

  return {
    session,
    articlesCount,
    countedArticles,
    progress: articlesCount ? Math.round((countedArticles / articlesCount) * 100) : 0,
  };
};

export const getPersonnelOverview = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const inventories = await Inventory.find({ assignedCounterId: personnelId })
      .populate("warehouseId", "name location")
      .sort({ updatedAt: -1 })
      .lean();

    const inventorySummaries = [];
    let countedArticlesCount = 0;
    let completedInventoriesCount = 0;

    for (const inventory of inventories) {
      const progress = await getInventoryProgress({ inventory, personnelId });
      countedArticlesCount += progress.countedArticles;
      const isCompleted = inventory.status === "Closed" || progress.session?.status === "submitted";
      if (isCompleted) completedInventoriesCount += 1;
      if (!isCompleted) {
        inventorySummaries.push({
          _id: inventory._id,
          name: inventory.name,
          status: inventory.status,
          inventoryDate: inventory.inventoryDate,
          warehouse: inventory.warehouseId,
          session: progress.session,
          articlesCount: progress.articlesCount,
          countedArticles: progress.countedArticles,
          progress: progress.progress,
          completed: isCompleted,
        });
      }
    }

    return res.status(200).json({
      assignedInventoriesCount: inventories.length,
      completedInventoriesCount,
      countedArticlesCount,
      completionRate: inventories.length ? Math.round((completedInventoriesCount / inventories.length) * 100) : 0,
      inventories: inventorySummaries,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAssignedCountSessions = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const sessions = await InventoryCount.find({ assignedPersonnelId: personnelId })
      .populate("inventoryId")
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const startCountSession = async (req, res) => {
  try {
    const { inventoryId, assignedPersonnelId, countNumber = 1 } = req.body;

    if (!inventoryId || !assignedPersonnelId) {
      return res
        .status(400)
        .json({ error: "inventoryId and assignedPersonnelId are required" });
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) return res.status(404).json({ error: "Inventory not found" });

    const session = await InventoryCount.findOneAndUpdate(
      { inventoryId, assignedPersonnelId, countNumber },
      { status: "in_progress" },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await TimeTracking.findOneAndUpdate(
      { inventoryCountId: session._id, endTime: null },
      { endTime: new Date() },
    );

    // Start initial time tracking log
    const log = new TimeTracking({
      inventoryCountId: session._id,
      startTime: new Date(),
    });
    await log.save();

    const articles = await Article.find({ warehouseId: inventory.warehouseId })
      .select("code name description category location barcode unit")
      .sort({ code: 1 })
      .lean();

    res.status(201).json({ session, articles });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getInventoryArticles = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { personnelId } = req.query;
    if (!personnelId) return res.status(400).json({ error: "personnelId is required" });

    const inventory = await Inventory.findOne({ _id: inventoryId, assignedCounterId: personnelId }).lean();
    if (!inventory) return res.status(404).json({ error: "Assigned inventory not found" });
    if (inventory.status === "Closed") {
      return res.status(403).json({ error: "This inventory has already been submitted" });
    }

    const submittedSession = await InventoryCount.findOne({
      inventoryId,
      assignedPersonnelId: personnelId,
      countNumber: 1,
      status: "submitted",
    }).lean();
    if (submittedSession) {
      return res.status(403).json({ error: "This inventory has already been submitted" });
    }

    const session = await InventoryCount.findOneAndUpdate(
      { inventoryId, assignedPersonnelId: personnelId, countNumber: 1 },
      { status: "in_progress" },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const articles = await Article.find({ warehouseId: inventory.warehouseId })
      .select("code name description category location barcode unit")
      .sort({ code: 1 })
      .lean();
    const existingItems = await InventoryCountItem.find({ inventoryCountId: session._id }).lean();
    const quantityByArticleId = new Map(
      existingItems.map((item) => [item.articleId.toString(), item.countedQuantity]),
    );

    return res.status(200).json({
      inventory,
      session,
      articles: articles.map((article) => ({
        ...article,
        countedQuantity: quantityByArticleId.get(article._id.toString()) ?? null,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const syncCountedItems = async (req, res) => {
  try {
    const { inventoryCountId, items = [] } = req.body;
    if (!inventoryCountId) {
      return res.status(400).json({ error: "inventoryCountId is required" });
    }

    let savedCount = 0;
    for (const item of items) {
      if (!item.articleId) continue;
      const countedQuantity = Number(item.countedQuantity || 0);
      await InventoryCountItem.findOneAndUpdate(
        { inventoryCountId, articleId: item.articleId },
        { $set: { inventoryCountId, articleId: item.articleId, countedQuantity } },
        { upsert: true, new: true },
      );
      await Article.findByIdAndUpdate(item.articleId, {
        countedQuantity,
        countedAt: new Date(),
      });
      savedCount += 1;
    }
    res.status(200).json({ count: savedCount, message: "Sync successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCountStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const session = await InventoryCount.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (status === "paused" || status === "submitted") {
      await TimeTracking.findOneAndUpdate(
        { inventoryCountId: req.params.id, endTime: null },
        { endTime: new Date() },
      );
    } else if (status === "in_progress") {
      const openLog = await TimeTracking.findOne({
        inventoryCountId: req.params.id,
        endTime: null,
      });
      if (!openLog) {
        await TimeTracking.create({
          inventoryCountId: req.params.id,
          startTime: new Date(),
        });
      }
    }

    if (status === "submitted" && session?.inventoryId) {
      const inventory = await Inventory.findByIdAndUpdate(
        session.inventoryId,
        { status: "Closed" },
        { returnDocument: "after" },
      );
      if (inventory?.companyId) {
        await createNotification({
          recipientRole: "CompanyOwner",
          companyId: inventory.companyId,
          title: `${inventory.name} count completed`,
          body: "A counter submitted the final count for this inventory.",
          type: "count_completed",
          entityType: "Inventory",
          entityId: inventory._id,
          href: `/app/inventories/${inventory._id}`,
        }).catch(() => undefined);
        await createNotification({
          recipientRole: "Admin",
          companyId: inventory.companyId,
          title: `${inventory.name} count completed`,
          body: "A counter submitted the final count for this inventory.",
          type: "count_completed",
          entityType: "Inventory",
          entityId: inventory._id,
          href: `/app/inventories/${inventory._id}`,
        }).catch(() => undefined);
        await createNotification({
          recipientRole: "Gestionnaire",
          companyId: inventory.companyId,
          title: `${inventory.name} count completed`,
          body: "A counter submitted the final count for this inventory.",
          type: "count_completed",
          entityType: "Inventory",
          entityId: inventory._id,
          href: `/app/inventories/${inventory._id}`,
        }).catch(() => undefined);
      }
    }

    res.status(200).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getSessionTime = async (req, res) => {
  try {
    const logs = await TimeTracking.find({ inventoryCountId: req.params.id }).lean();
    const elapsed = logs.reduce((total, log) => {
      const start = new Date(log.startTime).getTime();
      const end = log.endTime ? new Date(log.endTime).getTime() : Date.now();
      return total + Math.max(0, end - start);
    }, 0);

    res.status(200).json({ elapsedMs: elapsed, elapsedSeconds: Math.round(elapsed / 1000) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
