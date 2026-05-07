import express from "express";
import {
  checkAuth,
  createUser,
  forgotPassword,
  login,
  logout,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/auth.controllers.js";

const router = express.Router();
router.post("/login", login);
router.post("/logout", logout);
router.post("/create-user", createUser);
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.get("/check-auth", checkAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
