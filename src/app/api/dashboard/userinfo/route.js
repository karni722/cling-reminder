// src/app/api/dashboard/userinfo/route.js
import { NextResponse } from "next/server";

import mongoose from "mongoose";
import { cookies } from "next/headers";

import jwt from "jsonwebtoken";
import { connectDB } from "cling-reminder-backend/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// Define User schema inline to avoid import issues
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, index: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// helper to read user id from cookie (returns null if none/invalid)
async function getUserIdFromCookie() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    // JWT token uses 'sub' field for user ID (from verifyOtpRouter)
    return decoded.sub || decoded.id || decoded._id || null;
  } catch (e) {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user info (excluding sensitive data if any)
    return NextResponse.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("GET /api/dashboard/userinfo error:", err);
    console.error("Error details:", err.message, err.stack);
    return NextResponse.json({ 
      error: "Server error", 
      details: process.env.NODE_ENV === "development" ? err.message : undefined 
    }, { status: 500 });
  }
}

