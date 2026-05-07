import { parse } from "csv-parse/sync";
import { Article } from "../models/article.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { requireCompanyScope } from "../utils/scope.js";

// --- Article Handlers (Containment logic) ---
export const createArticle = async (req, res) => {
  try {
    const newArticle = new Article(req.body);
    const saved = await newArticle.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const importArticlesCsv = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;

    const warehouse = await Warehouse.findById(req.params.warehouseId);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    if (warehouse.companyId?.toString() !== companyId.toString()) {
      return res.status(403).json({ message: "Warehouse does not belong to your company" });
    }
    if (!req.file?.buffer) return res.status(400).json({ message: "CSV file is required" });

    const rows = parse(req.file.buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const operations = rows
      .filter((row) => row.code && row.name)
      .map((row) => ({
        updateOne: {
          filter: { warehouseId: warehouse._id, code: row.code },
          update: {
            $set: {
              companyId,
              warehouseId: warehouse._id,
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

    if (!operations.length) {
      return res.status(400).json({ message: "CSV must contain at least code and name columns" });
    }

    const result = await Article.bulkWrite(operations);
    return res.status(200).json({
      imported: operations.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const getArticlesByWarehouse = async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) return;

    const warehouse = await Warehouse.findById(req.params.warehouseId);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    if (warehouse.companyId?.toString() !== companyId.toString()) {
      return res.status(403).json({ message: "Warehouse does not belong to your company" });
    }

    // Explicitly filters articles by their parent warehouse per the diagram
    const articles = await Article.find({
      warehouseId: req.params.warehouseId,
    });
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
