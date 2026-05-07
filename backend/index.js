import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import articleRoutes from "./routes/article.route.js";
import warehouseRoutes from "./routes/warehouse.route.js";
import companyRoutes from "./routes/company.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import sheetsRoutes from "./routes/sheets.route.js";
import usersRoutes from "./routes/users.route.js";
import articlesCompatRoutes from "./routes/articles.compat.route.js";
import aiRoutes from "./routes/ai.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import terrainRoutes from "./routes/terrainRoutes.js";
import trialRequestRoutes from "./routes/trialRequest.route.js";
import notificationRoutes from "./routes/notification.route.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/article", articleRoutes);
app.use("/api/articles", articlesCompatRoutes);
app.use("/api/sheets", sheetsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/terrain", terrainRoutes);
app.use("/api/trial-requests", trialRequestRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
