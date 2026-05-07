import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    legalName: { type: String },
  },
  { timestamps: true },
);

export const Company = mongoose.model("Company", CompanySchema);
