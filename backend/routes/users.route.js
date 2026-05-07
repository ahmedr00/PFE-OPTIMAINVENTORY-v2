import express from "express";
import {
  createUser,
  changePassword,
  deleteUser,
  getCounters,
  getUsers,
  updateUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/get-users", verifyToken, getUsers);
router.get("/get-counters", verifyToken, getCounters);
router.post("/create-user", verifyToken, createUser);
router.put("/me/password", verifyToken, changePassword);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);

export default router;

