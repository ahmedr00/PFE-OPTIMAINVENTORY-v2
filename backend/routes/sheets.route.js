import express from "express";
import {
  assignCompteur,
  createSheet,
  deleteSheet,
  getSheetById,
  getSheets,
} from "../controllers/sheet.controller.js";

const router = express.Router();

router.get("/get-sheet", getSheets);
router.post("/create-sheet", createSheet);
router.get("/:id", getSheetById);
router.put("/:id", assignCompteur);
router.delete("/:id", deleteSheet);

export default router;

