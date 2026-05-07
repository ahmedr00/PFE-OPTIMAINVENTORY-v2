import mongoose from "mongoose";

const CompanyOwnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
});

export const CompanyOwner = mongoose.model("CompanyOwner", CompanyOwnerSchema);
