import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { Company } from "../models/company.model.js";
import { TrialRequest } from "../models/trialRequest.model.js";
import { User } from "../models/user.model.js";
import { createNotification } from "./notification.controller.js";
import {
  sendCredentialsEmail,
  sendTrialRequestToSuperAdminEmail,
} from "../services/email.service.js";

const sanitizeUser = (userDoc) => ({
  ...userDoc,
  password: undefined,
});

const generateTempPassword = () => crypto.randomBytes(8).toString("base64url");

export const createTrialRequest = async (req, res) => {
  try {
    const { companyName, legalName, adminName, email, phone, message } = req.body;
    if (!companyName || !adminName || !email) {
      return res.status(400).json({ message: "companyName, adminName, and email are required" });
    }

    const request = await TrialRequest.create({
      companyName,
      legalName,
      adminName,
      email,
      phone,
      message,
    });

    await createNotification({
      recipientRole: "SuperAdmin",
      title: `${companyName} requested access`,
      body: `${adminName} (${email}) submitted a new trial request.`,
      type: "trial_request",
      entityType: "TrialRequest",
      entityId: request._id,
      href: "/app/companies",
    }).catch(() => undefined);
    await sendTrialRequestToSuperAdminEmail({ request });

    return res.status(201).json({ request });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTrialRequests = async (req, res) => {
  try {
    if (req.user?.role !== "SuperAdmin") return res.status(403).json({ message: "Forbidden" });
    const filter = req.query.status ? { status: req.query.status } : {};
    const requests = await TrialRequest.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ requests });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const approveTrialRequest = async (req, res) => {
  try {
    if (req.user?.role !== "SuperAdmin") return res.status(403).json({ message: "Forbidden" });
    const request = await TrialRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Trial request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Trial request was already reviewed" });
    }

    const companyName = req.body.companyName || request.companyName;
    const legalName = req.body.legalName ?? request.legalName;
    const adminName = req.body.adminName || request.adminName;
    const email = req.body.email || request.email;

    if (!companyName || !adminName || !email) {
      return res.status(400).json({ message: "companyName, adminName, and email are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message:
          "A user with this email already exists. Change the requester email before approving so credentials can be sent to a new company owner.",
      });
    }

    const company = await Company.create({
      name: companyName,
      legalName,
    });

    const temporaryPassword = generateTempPassword();
    const password = await bcryptjs.hash(temporaryPassword, 10);
    const user = await User.create({
      name: adminName,
      email,
      role: "CompanyOwner",
      companyId: company._id,
      password,
      isVerified: true,
    });

    try {
      await sendCredentialsEmail({
        to: email,
        name: adminName,
        email,
        password: temporaryPassword,
        companyName,
      });
    } catch (err) {
      await User.findByIdAndDelete(user._id).catch(() => undefined);
      await Company.findByIdAndDelete(company._id).catch(() => undefined);
      return res.status(500).json({ message: err.message || "Could not send approval email" });
    }

    request.status = "approved";
    request.companyId = company._id;
    request.adminUserId = user._id;
    request.reviewedAt = new Date();
    await request.save();

    return res.status(200).json({
      request,
      company,
      admin: sanitizeUser(user._doc),
      temporaryPassword,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const rejectTrialRequest = async (req, res) => {
  try {
    if (req.user?.role !== "SuperAdmin") return res.status(403).json({ message: "Forbidden" });
    const request = await TrialRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Trial request not found" });

    request.status = "rejected";
    request.reviewedAt = new Date();
    await request.save();

    return res.status(200).json({ request });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
