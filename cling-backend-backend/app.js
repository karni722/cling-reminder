// app.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import generateRouter from "./routers/aiRouter.js";
import sendOtpRouter from "./routers/sendOtpRouter.js";
import verifyOtpRouter from "./routers/verifyOtpRouter.js";
import remindersRouter from "./routers/remindersRouter.js";
import dashboardRouter from "./routers/dashboardRouter.js";
import logoutRouter from "./routers/logoutRouter.js";

// Load .env from this backend folder explicitly (works even when started from monorepo root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3002", credentials: true }));

// serve uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// mount
app.use("/api/generate-image", generateRouter);
app.use("/api/send-otp", sendOtpRouter);
app.use("/api/verify-otp", verifyOtpRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/logout", logoutRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
