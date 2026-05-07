import express from "express";
import { Article } from "../models/article.model.js";

const router = express.Router();

// Frontend store compatibility: GET /api/articles/get-articles -> { articles: [...] }
router.get("/get-articles", async (req, res) => {
  try {
    const articles = await Article.find().sort({ _id: -1 });
    return res.status(200).json({ articles });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Frontend store compatibility: GET /api/articles/:id -> { article: {...} }
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    return res.status(200).json({ article });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;

