import express from "express";
import { getDashboardAnalytics } from "../controllers/analytics.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getDashboardAnalytics);

export default router;
