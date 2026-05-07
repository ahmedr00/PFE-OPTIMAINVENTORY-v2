import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Gestionnaire",
        "Compteur",
        "SuperAdmin",
        "CompanyOwner",
        "InventoryPersonnel",
      ],
      default: "Admin",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isVerified: { type: Boolean, default: true },
    verificationToken: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);
export const User = mongoose.model("User", UserSchema);
