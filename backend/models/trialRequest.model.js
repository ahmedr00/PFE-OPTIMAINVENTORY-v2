import mongoose from "mongoose";

const TrialRequestSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    legalName: { type: String, default: "", trim: true },
    adminName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    message: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const TrialRequest = mongoose.model("TrialRequest", TrialRequestSchema);
