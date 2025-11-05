import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "../../lib/mongodb.js";
import Otp from "../models/otp.js";
import nodemailer from "nodemailer";

const OTP_TTL_MIN = 10;
const RATE_LIMIT_MIN = 1;

async function sendEmail(to, subject, text, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });
}

function generateOtp() {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

export async function sendOtp(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

    await connectDB();

    const last = await Otp.findOne({ email }).sort({ createdAt: -1 }).limit(1);
    if (last) {
      const diff = (Date.now() - new Date(last.createdAt).getTime()) / 1000;
      if (diff < RATE_LIMIT_MIN * 60) {
        return NextResponse.json({ message: `Please wait ${RATE_LIMIT_MIN} minute(s) before requesting again.` }, { status: 429 });
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

    return NextResponse.json({ message: "OTP sent" }, { status: 200 });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
