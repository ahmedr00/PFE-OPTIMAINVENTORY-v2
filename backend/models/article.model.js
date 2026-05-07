import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    reference: { type: String, trim: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    barcode: { type: String, default: "", trim: true },
    unit: { type: String, default: "pcs", trim: true },
    unitPrice: { type: Number, default: 0, min: 0 },
    theoreticalQuantity: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    countedQuantity: { type: Number, default: null },
    countedAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ArticleSchema.index({ warehouseId: 1, code: 1 }, { unique: true });
ArticleSchema.index({ barcode: 1 }, { sparse: true });

export const Article = mongoose.model("Article", ArticleSchema);
