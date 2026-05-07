import { Article } from "../models/article.model.js";
import { ComparisonResult } from "../models/comparison.model.js";
import { Inventory } from "../models/inventory.model.js";
import { generateInventoryInsights } from "../services/aiProvider.service.js";
import { isSuperAdmin, requireCompanyScope } from "../utils/scope.js";

const normalizeStatus = (article) => {
  const counted =
    typeof article?.countedQuantity === "number"
      ? article.countedQuantity
      : article?.counted;

  if (typeof counted !== "number") return "pending";

  // Support both schemas (`stock` in mobileBackend style and potential `theoreticalQuantity`)
  const theoretical = typeof article.stock === "number" ? article.stock : article.theoreticalQuantity;
  if (typeof theoretical !== "number") return "counted";

  const diff = counted - theoretical;
  if (diff < 0) return "missing";
  if (diff > 0) return "excess";
  return "conform";
};

const normalizeComparisonStatus = (comparison) => {
  const diff = (comparison.finalQty || 0) - (comparison.technicalQty || 0);
  if (diff < 0) return "missing";
  if (diff > 0) return "excess";
  return "conform";
};

const pushArticleSample = (samples, status, article, detail = {}) => {
  if (!article || samples[status].length >= 8) return;
  samples[status].push({
    name: article.name,
    code: article.code,
    ...detail,
  });
};

export const getReportInsights = async (req, res) => {
  try {
    const { warehouseId, inventoryId } = req.query;
    const companyId = isSuperAdmin(req.user)
      ? req.query.companyId || null
      : requireCompanyScope(req, res);
    if (!isSuperAdmin(req.user) && !companyId) return;

    const inventoryFilter = {};
    if (companyId) inventoryFilter.companyId = companyId;
    if (warehouseId) inventoryFilter.warehouseId = warehouseId;
    if (inventoryId) inventoryFilter._id = inventoryId;

    const inventories = await Inventory.find(inventoryFilter).lean();
    if (inventoryId && inventories.length === 0) {
      return res.status(404).json({ success: false, message: "Inventory not found in scope" });
    }
    const inventoryIds = inventories.map((inventory) => inventory._id);

    const articleFilter = {};
    if (warehouseId) {
      articleFilter.warehouseId = warehouseId;
    } else if (inventoryId && inventories[0]?.warehouseId) {
      articleFilter.warehouseId = inventories[0].warehouseId;
    }
    if (companyId) articleFilter.companyId = companyId;

    const comparisonFilter = {};
    if (inventoryId) comparisonFilter.inventoryId = inventoryId;
    else if (inventoryIds.length) comparisonFilter.inventoryId = { $in: inventoryIds };
    else comparisonFilter.inventoryId = { $in: [] };

    const articles = await Article.find(articleFilter).lean();
    const comparisons = await ComparisonResult.find(comparisonFilter).lean();

    const statusCounts = {
      conform: 0,
      missing: 0,
      excess: 0,
      pending: 0,
      counted: 0,
    };
    const articleSamples = {
      conform: [],
      missing: [],
      excess: [],
    };

    const varianceTotals = {
      missingQuantity: 0,
      excessQuantity: 0,
      absoluteVariance: 0,
      inventoryValueVariance: 0,
    };

    if (comparisons.length) {
      const articleIds = comparisons.map((comparison) => comparison.articleId);
      const comparisonArticles = await Article.find({ _id: { $in: articleIds } }).lean();
      const articleById = new Map(
        comparisonArticles.map((article) => [article._id.toString(), article]),
      );
      for (const comparison of comparisons) {
        const status = normalizeComparisonStatus(comparison);
        const diff = (comparison.finalQty || 0) - (comparison.technicalQty || 0);
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        pushArticleSample(articleSamples, status, articleById.get(comparison.articleId.toString()), {
          technicalQty: comparison.technicalQty || 0,
          finalQty: comparison.finalQty || 0,
          variance: diff,
        });
        if (diff < 0) varianceTotals.missingQuantity += Math.abs(diff);
        if (diff > 0) varianceTotals.excessQuantity += diff;
        varianceTotals.absoluteVariance += Math.abs(diff);
      }
    } else {
      for (const article of articles) {
        const status = normalizeStatus(article);
        const counted =
          typeof article.countedQuantity === "number"
            ? article.countedQuantity
            : article.counted;
        const theoretical =
          typeof article.stock === "number" ? article.stock : article.theoreticalQuantity;
        const diff =
          typeof counted === "number" && typeof theoretical === "number"
            ? counted - theoretical
            : 0;

        if (diff < 0) varianceTotals.missingQuantity += Math.abs(diff);
        if (diff > 0) varianceTotals.excessQuantity += diff;
        varianceTotals.absoluteVariance += Math.abs(diff);
        varianceTotals.inventoryValueVariance += Math.abs(diff) * (article.unitPrice || 0);
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        pushArticleSample(articleSamples, status, article, {
          theoreticalQty: theoretical || 0,
          countedQty: counted || 0,
          variance: diff,
        });
      }
    }

    if (comparisons.length) {
      const articleIds = comparisons.map((comparison) => comparison.articleId);
      const pricedArticles = await Article.find({ _id: { $in: articleIds } }).lean();
      const priceByArticleId = new Map(
        pricedArticles.map((article) => [article._id.toString(), article.unitPrice || 0]),
      );
      for (const comparison of comparisons) {
        const diff = (comparison.finalQty || 0) - (comparison.technicalQty || 0);
        varianceTotals.inventoryValueVariance +=
          Math.abs(diff) * (priceByArticleId.get(comparison.articleId.toString()) || 0);
      }
    }

    const source = comparisons.length ? "comparison-results" : "article-count-fields";
    for (const status of Object.keys(statusCounts)) {
      statusCounts[status] = statusCounts[status] || 0;
    }

    const stats = {
      filters: {
        companyId: companyId || null,
        warehouseId: warehouseId || null,
        inventoryId: inventoryId || null,
      },
      totals: {
        sheets: 0,
        inventories: inventories.length,
        articles: articles.length,
        comparisons: comparisons.length,
      },
      statusCounts,
      articleSamples,
      varianceTotals,
      source,
      generatedAt: new Date().toISOString(),
    };

    const ai = await generateInventoryInsights(stats);

    return res.status(200).json({
      success: true,
      stats,
      ai,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
