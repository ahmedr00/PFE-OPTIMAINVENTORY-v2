import mongoose from "mongoose";

const InventoryCountSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    countNumber: { type: Number, required: true }, // Count 1, 2, or 3
    assignedPersonnelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "paused", "submitted"],
      default: "pending",
    },
    totalElapsedTime: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const InventoryCount = mongoose.model(
  "InventoryCount",
  InventoryCountSchema,
);
