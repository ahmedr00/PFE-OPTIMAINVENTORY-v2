import express from "express";
import multer from "multer";
import {
  createInventory,
  getInventoriesByCompany,
  uploadTechnicalData,
  getComparisonReport,
  getInventoryByWarehouse,
} from "../controllers/inventory.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.post("/", verifyToken, createInventory);
router.get("/company/:companyId", verifyToken, getInventoriesByCompany);
router.post("/:id/technical", verifyToken, upload.single("file"), uploadTechnicalData);
router.get("/:id/comparison", verifyToken, getComparisonReport);
router.get("/warehouse/:warehouseId", verifyToken, getInventoryByWarehouse);

export default router;
