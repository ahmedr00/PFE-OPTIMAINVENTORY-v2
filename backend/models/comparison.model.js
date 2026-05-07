import mongoose from "mongoose";

const ComparisonResultSchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article",
    required: true,
  },
  technicalQty: { type: Number, default: 0 },
  count1Qty: { type: Number, default: 0 },
  count2Qty: { type: Number, default: 0 },
  count3Qty: { type: Number, default: 0 },
  finalQty: { type: Number, default: 0 },
});

export const ComparisonResult = mongoose.model(
  "ComparisonResult",
  ComparisonResultSchema,
);
