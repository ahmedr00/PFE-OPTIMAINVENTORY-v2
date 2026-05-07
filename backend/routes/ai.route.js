import express from "express";
import { getReportInsights } from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/report-insights", verifyToken, getReportInsights);

export default router;

