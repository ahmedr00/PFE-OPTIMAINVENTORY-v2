import { parse } from "csv-parse/sync";
import { Article } from "../models/article.model.js";
import { Inventory } from "../models/inventory.model.js";
import { TechnicalInventory } from "../models/technicalInventory.model.js";
import { ComparisonResult } from "../models/comparison.model.js";
import { User } from "../models/user.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { requireCompanyScope } from "../utils/scope.js";

const counterRoles = ["Compteur", "InventoryPersonnel"];

export const createInventory = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;

    const warehouse = await Warehouse.findOne({ _id: req.body.warehouseId, companyId });
    if (!warehouse) return res.status(400).json({ message: "Invalid warehouse for company" });

    if (req.body.assignedCounterId) {
      const counter = await User.findOne({
        _id: req.body.assignedCounterId,
        companyId,
        role: { $in: counterRoles },
      });
      if (!counter) return res.status(400).json({ message: "Invalid company counter" });
    }

    const inventory = new Inventory({
      companyId,
      warehouseId: req.body.warehouseId,
      name: req.body.name,
      status: req.body.status,
      assignedCounterId: req.body.assignedCounterId || null,
    });
    await inventory.save();
    res.status(201).json(inventory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const uploadTechnicalData = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;

    const inventory = await Inventory.findOne({ _id: req.params.id, companyId });
    if (!inventory) return res.status(404).json({ message: "Inventory not found" });
    if (!req.file?.buffer) return res.status(400).json({ message: "Technical CSV file is required" });

    const rows = parse(req.file.buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const usableRows = rows.filter((row) => (row.code || row.reference) && row.technicalQty !== undefined);
    if (!usableRows.length) {
      return res.status(400).json({ message: "CSV must contain code or reference and technicalQty columns" });
    }

    const references = usableRows.map((row) => row.reference || row.code);
    const articles = await Article.find({
      companyId,
      warehouseId: inventory.warehouseId,
      $or: [{ code: { $in: references } }, { reference: { $in: references } }],
    });
    const articleByReference = new Map();
    for (const article of articles) {
      articleByReference.set(article.code, article);
      if (article.reference) articleByReference.set(article.reference, article);
    }

    let matchedRows = 0;
    for (const row of usableRows) {
      const article = articleByReference.get(row.reference || row.code);
      if (!article) continue;
      matchedRows += 1;
      const technicalQty = Number(row.technicalQty || 0);
      const existing = await ComparisonResult.findOne({ inventoryId: inventory._id, articleId: article._id });
      await ComparisonResult.findOneAndUpdate(
        { inventoryId: inventory._id, articleId: article._id },
        {
          $set: {
            technicalQty,
            count1Qty: existing?.count1Qty || 0,
            count2Qty: existing?.count2Qty || 0,
            count3Qty: existing?.count3Qty || 0,
            finalQty:
              existing?.finalQty ??
              article.countedQuantity ??
              article.theoreticalQuantity ??
              article.stock ??
              technicalQty,
          },
        },
        { upsert: true },
      );
    }

    const technical = await TechnicalInventory.findOneAndUpdate(
      { inventoryId: req.params.id },
      {
        $set: {
          inventoryId: req.params.id,
          uploadedFile: req.file.originalname,
          originalName: req.file.originalname,
          rowCount: usableRows.length,
          matchedRows,
          uploadedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );
    res.status(201).json({
      technical,
      imported: usableRows.length,
      matched: matchedRows,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
export const getInventoriesByCompany = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const inventory = await Inventory.find({ companyId }).populate("assignedCounterId", "name email");
    if (!inventory)
      return res.status(404).json({ message: "Inventory not found" });
    res.status(200).json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getComparisonReport = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const inventoryId = req.params.id;

    const inventory = await Inventory.findOne({ _id: inventoryId, companyId }).populate(
      "assignedCounterId",
      "name email",
    );
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const technical = await TechnicalInventory.findOne({ inventoryId });
    const comparison = await ComparisonResult.findOne({ inventoryId });

    return res.status(200).json({
      inventory,
      technical,
      comparison,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
export const getInventoryByWarehouse = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const warehouse = await Warehouse.findOne({ _id: req.params.warehouseId, companyId });
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    const inventory = await Inventory.find({
      warehouseId: req.params.warehouseId,
      companyId,
    });
    if (!inventory)
      return res.status(404).json({ message: "Inventory not found" });
    res.status(200).json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
