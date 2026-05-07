import mongoose from "mongoose";

const TechnicalInventorySchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  uploadedFile: { type: String },
  originalName: { type: String, default: "" },
  rowCount: { type: Number, default: 0 },
  matchedRows: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

export const TechnicalInventory = mongoose.model(
  "TechnicalInventory",
  TechnicalInventorySchema,
);
