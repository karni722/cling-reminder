// models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index possible
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Otp || mongoose.model("Otp", otpSchema);
