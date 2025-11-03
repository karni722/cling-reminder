import express from "express";
import crypto from "crypto";
import { connectDB } from "../lib/mongodb.js";
import Otp from "../models/otp.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_env";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function parseMaxAge(m) {
  if (!m) return 7 * 24 * 60 * 60;
  if (m.endsWith("d")) return parseInt(m.slice(0, -1)) * 24 * 60 * 60;
  if (m.endsWith("h")) return parseInt(m.slice(0, -1)) * 60 * 60;
  return 7 * 24 * 60 * 60;
}

router.post("/", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    await connectDB();

    const now = new Date();
    const otpRecords = await Otp.find({ email }).sort({ createdAt: -1 }).limit(5);
    if (!otpRecords || otpRecords.length === 0) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const matched = otpRecords.find((rec) => rec.otpHash === otpHash && new Date(rec.expiresAt) > now);
    if (!matched) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const maxAgeSeconds = parseMaxAge(process.env.JWT_EXPIRES_IN);

    // set cookie
    res.cookie = res.cookie || function () {};
    // Express sets cookies via res.cookie if cookie-parser or default used; set header manually here
    const cookieValue = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
    res.setHeader("Set-Cookie", cookieValue);

    return res.json({ message: "Logged in" });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
