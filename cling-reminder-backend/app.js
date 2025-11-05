// app.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import generateRouter from "./routers/aiRouter.js";
import sendOtpRouter from "./routers/sendOtpRouter.js";
import verifyOtpRouter from "./routers/verifyOtpRouter.js";
import { connectDB } from "./lib/mongodb.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 🧩 Connect to MongoDB first
connectDB()
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop server if DB fails
  });



// serve uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// mount
app.use("/api/generate-image", generateRouter);
app.use("/api/send-otp", sendOtpRouter);
app.use("/api/verify-otp", verifyOtpRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
