import express from "express";
import {
  getAssignedCountSessions,
  getInventoryArticles,
  getPersonnelOverview,
  getSessionTime,
  startCountSession,
  syncCountedItems,
  updateCountStatus,
} from "../controllers/terrainController.js";

const router = express.Router();

router.get("/personnel/:personnelId/sessions", getAssignedCountSessions);
router.get("/personnel/:personnelId/overview", getPersonnelOverview);
router.get("/inventory/:inventoryId/articles", getInventoryArticles);
router.post("/session/start", startCountSession);
router.patch("/session/:id/status", updateCountStatus);
router.post("/items/sync", syncCountedItems);
router.get("/session/:id/time", getSessionTime);

export default router;