import mongoose from "mongoose";

const InventoryCountItemSchema = new mongoose.Schema({
  inventoryCountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryCount",
    required: true,
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article",
    required: true,
  },
  countedQuantity: { type: Number, required: true, default: 0 },
});

export const InventoryCountItem = mongoose.model(
  "InventoryCountItem",
  InventoryCountItemSchema,
);
