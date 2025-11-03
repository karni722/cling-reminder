// src/app/api/reminders/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reminder from "../../../../backend/models/reminder";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// helper to read user id from cookie (returns null if none/invalid)
async function getUserIdFromCookie() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id || decoded._id || null;
  } catch (e) {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status");
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (q) filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
    if (status) filter.status = status;

    const total = await Reminder.countDocuments(filter);
    const data = await Reminder.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean();

    return NextResponse.json({ meta: { total, page, limit, returned: data.length }, data });
  } catch (err) {
    console.error("GET /api/reminders error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    // for quick local testing without auth: set TEST_MODE=true in .env.local
    const TEST_MODE = process.env.TEST_MODE === "true";

    let userId = null;
    if (!TEST_MODE) {
      userId = await getUserIdFromCookie();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      // provide a valid ObjectId string (replace with one from your users collection)
      userId = process.env.TEST_USER_ID || "000000000000000000000000";
    }

    const body = await req.json();
    const { title, description, date, time, device, category } = body;
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const reminder = await Reminder.create({
      user: userId,
      title,
      description,
      date: date ? new Date(date) : undefined,
      time,
      device,
      category,
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (err) {
    console.error("POST /api/reminders error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
