import mongoose from "mongoose";

const InventoryPersonnelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
});
export const InventoryPersonnel = mongoose.model(
  "InventoryPersonnel",
  InventoryPersonnelSchema,
);
