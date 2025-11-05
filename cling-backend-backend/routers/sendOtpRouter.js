import express from "express";
import crypto from "crypto";
import { connectDB } from "../lib/mongodb.js";
import Otp from "../models/otp.js";
import { sendEmail, generateOtp, OTP_TTL_MIN, RATE_LIMIT_MIN } from "../utils/emailUtils.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    await connectDB();

    const last = await Otp.findOne({ email }).sort({ createdAt: -1 }).limit(1);
    if (last) {
      const diff = (Date.now() - new Date(last.createdAt).getTime()) / 1000;
      if (diff < RATE_LIMIT_MIN * 60) {
        return res.status(429).json({ message: `Please wait ${RATE_LIMIT_MIN} minute(s) before requesting again.` });
      }
    }

    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

    await Otp.create({ email, otpHash, expiresAt });

    const subject = "Your login OTP";
    const text = `Your login OTP is ${otp}. It expires in ${OTP_TTL_MIN} minutes.`;
    const html = `<p>Your login OTP is <strong>${otp}</strong>.</p><p>It expires in ${OTP_TTL_MIN} minutes.</p>`;

    await sendEmail(email, subject, text, html);

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
