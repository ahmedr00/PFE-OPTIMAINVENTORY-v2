import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { User } from "../models/user.model.js";

const sanitizeUser = (userDoc) => ({
  ...userDoc,
  password: undefined,
  verificationToken: undefined,
  verificationTokenExpiresAt: undefined,
  passwordResetToken: undefined,
  passwordResetExpiresAt: undefined,
});

const generateTempPassword = () => process.env.DEFAULT_USER_PASSWORD || crypto.randomBytes(6).toString("base64url");
const counterRoles = ["Compteur", "InventoryPersonnel"];
const adminCreateRoles = ["CompanyOwner", "InventoryPersonnel"];
const superAdminCreateRoles = ["SuperAdmin", "CompanyOwner", "InventoryPersonnel"];

export const getUsers = async (req, res) => {
  try {
    const filter = req.user?.role === "SuperAdmin" ? {} : { companyId: req.user?.companyId };
    const users = await User.find(filter).select("-password");
    return res.status(200).json({ users });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCounters = async (req, res) => {
  try {
    const filter = { role: { $in: counterRoles } };
    if (req.user?.role !== "SuperAdmin") filter.companyId = req.user?.companyId;
    const counters = await User.find(filter).select("-password");
    return res.status(200).json(counters);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  const { name, email, role, companyId } = req.body;
  try {
    if (!name || !email || !role) {
      return res.status(400).json({ message: "name, email, role are required" });
    }
    const allowedRoles = req.user?.role === "SuperAdmin" ? superAdminCreateRoles : adminCreateRoles;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "You are not allowed to create users with this role" });
    }
    if (req.user?.role !== "SuperAdmin" && !req.user?.companyId) {
      return res.status(400).json({ message: "Your account is not linked to a company" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const tempPassword = generateTempPassword();
    const hashed = await bcryptjs.hash(tempPassword, 10);

    const user = await User.create({
      name,
      email,
      role,
      companyId: req.user?.role === "SuperAdmin" ? companyId || null : req.user?.companyId,
      password: hashed,
      isVerified: true,
    });

    return res.status(201).json({
      ...sanitizeUser(user._doc),
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isCurrentValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

