import mongoose from "mongoose";

const sheetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft", "pending", "in_progress", "completed", "validated"],
      default: "in_progress",
    },
    assignedCompteurs: [{ type: String, trim: true }],
    compteur1: { type: String, default: "", trim: true },
    compteur2: { type: String, default: "", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

sheetSchema.pre("validate", function normalizeAssignedCompteurs(next) {
  const all = [this.compteur1, this.compteur2, ...(this.assignedCompteurs || [])].filter(Boolean);
  this.assignedCompteurs = [...new Set(all)];
  next();
});

export const Sheet = mongoose.model("Sheet", sheetSchema);

