import { parse } from "csv-parse/sync";
import { Article } from "../models/article.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { requireCompanyScope } from "../utils/scope.js";

const buildArticleOperations = ({ rows, companyId, warehouseId }) =>
  rows
    .filter((row) => row.code && row.name)
    .map((row) => ({
      updateOne: {
        filter: { warehouseId, code: row.code },
        update: {
          $set: {
            companyId,
            warehouseId,
            reference: row.reference || row.code,
            code: row.code,
            name: row.name,
            barcode: row.barcode || "",
            location: row.location || "",
            category: row.category || "",
            unit: row.unit || "pcs",
            unitPrice: Number(row.unitPrice || 0),
            theoreticalQuantity: Number(row.theoreticalQuantity || row.stock || 0),
            stock: Number(row.stock || row.theoreticalQuantity || 0),
            description: row.description || "",
            active: true,
          },
        },
        upsert: true,
      },
    }));

const optionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// --- Warehouse Handlers ---
export const createWarehouse = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const newWarehouse = new Warehouse({
      name: req.body.name,
      location: req.body.location,
      latitude: optionalNumber(req.body.latitude),
      longitude: optionalNumber(req.body.longitude),
      companyId,
    });
    const saved = await newWarehouse.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const createWarehouseWithArticles = async (req, res) => {
  let warehouse = null;
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;

    if (!req.body.name) {
      return res.status(400).json({ message: "Warehouse name is required" });
    }

    let rows = [];
    if (req.file?.buffer) {
      rows = parse(req.file.buffer.toString("utf8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      if (!rows.some((row) => row.code && row.name)) {
        return res.status(400).json({ message: "CSV must contain at least code and name columns" });
      }
    }

    warehouse = await Warehouse.create({
      name: req.body.name,
      location: req.body.location,
      latitude: optionalNumber(req.body.latitude),
      longitude: optionalNumber(req.body.longitude),
      companyId,
    });

    if (!req.file?.buffer) {
      return res.status(201).json({ warehouse, imported: 0, upserted: 0, modified: 0 });
    }

    const operations = buildArticleOperations({ rows, companyId, warehouseId: warehouse._id });

    if (!operations.length) {
      await Warehouse.findByIdAndDelete(warehouse._id);
      return res.status(400).json({ message: "CSV must contain at least code and name columns" });
    }

    const result = await Article.bulkWrite(operations);
    return res.status(201).json({
      warehouse,
      imported: operations.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    if (warehouse?._id) {
      await Article.deleteMany({ warehouseId: warehouse._id }).catch(() => undefined);
      await Warehouse.findByIdAndDelete(warehouse._id).catch(() => undefined);
    }
    return res.status(400).json({ message: err.message });
  }
};

export const getWarehousesByCompany = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const warehouses = await Warehouse.find({
      companyId,
    });
    res.status(200).json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, companyId },
      {
        $set: {
          name: req.body.name,
          location: req.body.location,
          latitude: optionalNumber(req.body.latitude),
          longitude: optionalNumber(req.body.longitude),
        },
      },
      { returnDocument: "after" },
    );
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    return res.status(200).json(warehouse);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;
    const warehouse = await Warehouse.findOne({ _id: req.params.id, companyId });
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    const linkedInventories = await Inventory.countDocuments({ warehouseId: warehouse._id, companyId });
    if (linkedInventories > 0) {
      return res.status(400).json({
        message: "Cannot delete a warehouse that has inventories. Delete or archive the inventories first.",
      });
    }

    await Article.deleteMany({ warehouseId: warehouse._id, companyId });
    await Warehouse.deleteOne({ _id: warehouse._id });
    return res.status(200).json({ message: "Warehouse deleted" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
