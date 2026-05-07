import mongoose from "mongoose";

const TimeTrackingSchema = new mongoose.Schema({
  inventoryCountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryCount",
    required: true,
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
});

export const TimeTracking = mongoose.model("TimeTracking", TimeTrackingSchema);
