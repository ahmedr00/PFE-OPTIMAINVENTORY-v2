import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    recipientRole: {
      type: String,
      enum: ["Admin", "Gestionnaire", "Compteur", "SuperAdmin", "CompanyOwner", "InventoryPersonnel", null],
      default: null,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    type: {
      type: String,
      enum: ["trial_request", "count_completed", "system"],
      default: "system",
    },
    entityType: { type: String, default: "", trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    href: { type: String, default: "", trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", NotificationSchema);
