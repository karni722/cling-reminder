import express from "express";
import { connectDB } from "../lib/mongodb.js";
import User from "../models/user.js";
import Reminder from "../models/reminder.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

function getUserFromCookie(req) {
  try {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

router.get("/userinfo", async (req, res) => {
  try {
    await connectDB();
    const decoded = getUserFromCookie(req);
    if (!decoded) return res.status(401).json({ message: "Unauthorized" });

    const userId = decoded.sub || decoded.id || decoded._id;
    const email = decoded.email;

    const user = await User.findById(userId).lean();
    const [remindersCount, upcomingCount, completedCount] = await Promise.all([
      Reminder.countDocuments({ user: userId }),
      Reminder.countDocuments({ user: userId, status: "upcoming" }),
      Reminder.countDocuments({ user: userId, status: "completed" }),
    ]);

    return res.json({
      _id: userId,
      email: user?.email || email,
      name: user?.name || (email ? email.split("@")[0] : "User"),
      remindersCount,
      upcomingCount,
      completedCount,
      lastLogin: new Date().toISOString(),
    });
  } catch (err) {
    console.error("GET /api/dashboard/userinfo error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;



