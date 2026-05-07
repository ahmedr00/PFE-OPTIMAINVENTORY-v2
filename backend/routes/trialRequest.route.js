import express from "express";
import {
  approveTrialRequest,
  createTrialRequest,
  getTrialRequests,
  rejectTrialRequest,
} from "../controllers/trialRequest.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", createTrialRequest);
router.get("/", verifyToken, getTrialRequests);
router.post("/:id/approve", verifyToken, approveTrialRequest);
router.post("/:id/reject", verifyToken, rejectTrialRequest);

export default router;
