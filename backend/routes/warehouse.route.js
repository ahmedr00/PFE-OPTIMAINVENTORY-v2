import express from "express";
import multer from "multer";
import {
  createWarehouse,
  createWarehouseWithArticles,
  deleteWarehouse,
  getWarehousesByCompany,
  updateWarehouse,
} from "../controllers/warehouse.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// Warehouse Routes
router.post("/warehouses", verifyToken, createWarehouse);
router.post("/warehouses/with-articles", verifyToken, upload.single("file"), createWarehouseWithArticles);
router.get("/warehouses/company/:companyId", verifyToken, getWarehousesByCompany);
router.patch("/warehouses/:id", verifyToken, updateWarehouse);
router.delete("/warehouses/:id", verifyToken, deleteWarehouse);

export default router;
