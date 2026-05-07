import express from "express";
import multer from "multer";
import {
  createArticle,
  getArticlesByWarehouse,
  getArticleById,
  importArticlesCsv,
} from "../controllers/article.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/articles", verifyToken, createArticle);
router.post(
  "/warehouses/:warehouseId/import-csv",
  verifyToken,
  upload.single("file"),
  importArticlesCsv,
);
router.get("/articles/warehouse/:warehouseId", verifyToken, getArticlesByWarehouse);
router.get("/articles/:id", verifyToken, getArticleById);

export default router;
