import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyWarehouses,
} from "../controllers/company.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
// Super Admin routes
router.post("/", verifyToken, createCompany);
router.get("/", verifyToken, getAllCompanies);

// Company Specific routes
router.get("/:id", verifyToken, getCompanyById);
router.put("/:id", verifyToken, updateCompany);
router.delete("/:id", verifyToken, deleteCompany);

// Relations
router.get("/:id/warehouses", verifyToken, getCompanyWarehouses);

export default router;
