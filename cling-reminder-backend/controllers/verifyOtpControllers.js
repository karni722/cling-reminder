import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "../../lib/mongodb";
import Otp from "../models/otp";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function parseMaxAge(m) {
  if (!m) return 7 * 24 * 60 * 60;
  if (m.endsWith("d")) return parseInt(m.slice(0, -1)) * 24 * 60 * 60;
  if (m.endsWith("h")) return parseInt(m.slice(0, -1)) * 60 * 60;
  return 7 * 24 * 60 * 60;
}

export async function verifyOtp(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ message: "Email and OTP required" }, { status: 400 });

    await connectDB();

    const now = new Date();
    const otpRecords = await Otp.find({ email }).sort({ createdAt: -1 }).limit(5);
    if (!otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const matched = otpRecords.find((rec) => rec.otpHash === otpHash && new Date(rec.expiresAt) > now);
    if (!matched) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
    }

    await Otp.deleteMany({ email });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const maxAgeSeconds = parseMaxAge(process.env.JWT_EXPIRES_IN);

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    const res = NextResponse.json({ message: "Logged in" }, { status: 200 });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
