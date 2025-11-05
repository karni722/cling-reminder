import express from "express";
import { connectDB } from "../lib/mongodb.js";
import Reminder from "../models/reminder.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

function getUserIdFromRequest(req) {
  try {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub || decoded.id || decoded._id || null;
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const url = new URL(req.protocol + "://" + req.get("host") + req.originalUrl);
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status");
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    const total = await Reminder.countDocuments(filter);
    const data = await Reminder.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean();
    return res.json({ meta: { total, page, limit, returned: data.length }, data });
  } catch (err) {
    console.error("GET /api/reminders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    await connectDB();
    const TEST_MODE = process.env.TEST_MODE === "true";

    let userId = null;
    if (!TEST_MODE) {
      userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
    } else {
      userId = process.env.TEST_USER_ID || "000000000000000000000000";
    }

    const { title, description, date, time, device, category, icon_image_url } = req.body || {};
    if (!title) return res.status(400).json({ error: "Title is required" });

    const reminder = await Reminder.create({
      user: userId,
      title,
      description,
      date: date ? new Date(date) : undefined,
      time,
      device,
      category,
      icon_image_url,
    });

    return res.status(201).json(reminder);
  } catch (err) {
    console.error("POST /api/reminders error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;

// Delete reminder by id
router.delete("/:id", async (req, res) => {
  try {
    await connectDB();
    const decodedToken = getUserIdFromRequest(req);
    if (!decodedToken) return res.status(401).json({ error: "Unauthorized" });
    const userId = decodedToken;
    const { id } = req.params;
    const result = await Reminder.deleteOne({ _id: id, user: userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/reminders/:id error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


