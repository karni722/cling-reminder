import Reminder from "../models/reminder"; 
import mongoose from "mongoose";


function computeStatus(reminder) {
  if (!reminder) return reminder;
  if (reminder.status === "completed") return "completed";
  if (!reminder.date) return reminder.status || "upcoming";

  const now = new Date();
  const remDate = new Date(reminder.date);

  
  if (reminder.time && typeof reminder.time === "string") {
    
    const t = reminder.time.split(":").map((v) => parseInt(v, 10));
    if (t.length >= 2 && !Number.isNaN(t[0]) && !Number.isNaN(t[1])) {
      remDate.setHours(t[0], t[1], t[2] || 0, 0);
    }
  }

  return remDate < now ? "overdue" : (reminder.status || "upcoming");
}


// --- createReminder function UPDATED ---
export async function createReminder(req, res) {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // CHANGE 1: icon_image_url field ko destructure (extract) kiya gaya
    const { 
        title, 
        description, 
        date, 
        time, 
        device, 
        category,
        icon_image_url // <-- NAYA FIELD ADDED
    } = req.body;
    
    if (!title) return res.status(400).json({ error: "Title is required" });

    const reminder = new Reminder({
      user: mongoose.Types.ObjectId(userId),
      title,
      description,
      date: date ? new Date(date) : undefined,
      time,
      device,
      category,
      status: "upcoming",
      
      // CHANGE 2: Naye field ko Mongoose Model object mein pass kiya gaya
      icon_image_url, 
    });

    await reminder.save();
    return res.status(201).json(reminder);
  } catch (err) {
    console.error("createReminder error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
// ----------------------------------------


export async function getReminder(req, res) {
// ... (No change here)
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const reminder = await Reminder.findOne({ _id: id, user: userId }).lean();
    if (!reminder) return res.status(404).json({ error: "Reminder not found" });

    reminder.status = computeStatus(reminder);
    return res.json(reminder);
  } catch (err) {
    console.error("getReminder error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export async function listReminders(req, res) {
// ... (No change here, but remember to display icon_image_url in your frontend list)
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      page = 1,
      limit = 20,
      status,
      category,
      q,
      dateFrom,
      dateTo,
      sortBy = "date",
      order = "asc",
    } = req.query;

    const skip = (Math.max(parseInt(page, 10), 1) - 1) * Math.max(parseInt(limit, 10), 1);
    const take = Math.max(parseInt(limit, 10), 1);

    const filter = { user: mongoose.Types.ObjectId(userId) };

    if (category) filter.category = category;

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    
    if (status && status !== "overdue") {
      filter.status = status;
    }

    
    const sortField = ["createdAt", "date", "title"].includes(sortBy) ? sortBy : "date";
    const sortOrder = order === "desc" ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    const total = await Reminder.countDocuments(filter);

    const reminders = await Reminder.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(take)
      .lean();

    
    const processed = reminders.map((r) => ({ ...r, status: computeStatus(r) }));
    const finalList = status === "overdue" ? processed.filter((r) => r.status === "overdue") : processed;

    return res.json({
      meta: {
        total,
        page: parseInt(page, 10),
        limit: take,
        returned: finalList.length,
      },
      data: finalList,
    });
  } catch (err) {
    console.error("listReminders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export async function updateReminder(req, res) {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    // CHANGE: icon_image_url ko allowed fields mein add karein taaki user usko update kar sake
    const allowed = ["title", "description", "date", "time", "device", "category", "status", "icon_image_url"];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    // prevent invalid status
    if (updates.status && !["upcoming", "completed", "overdue"].includes(updates.status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    if (updates.date) updates.date = new Date(updates.date);

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true }
    ).lean();

    if (!reminder) return res.status(404).json({ error: "Reminder not found" });

    reminder.status = computeStatus(reminder);
    return res.json(reminder);
  } catch (err) {
    console.error("updateReminder error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export async function deleteReminder(req, res) {
// ... (No change here)
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const result = await Reminder.findOneAndDelete({ _id: id, user: userId }).lean();
    if (!result) return res.status(404).json({ error: "Reminder not found" });

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteReminder error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export async function markCompleted(req, res) {
// ... (No change here)
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { status: "completed" } },
      { new: true }
    ).lean();

    if (!reminder) return res.status(404).json({ error: "Reminder not found" });

    return res.json(reminder);
  } catch (err) {
    console.error("markCompleted error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export async function reconcileOverdue(req, res) {
// ... (No change here)
  try {
    
    const query = { status: "upcoming", date: { $lt: new Date() } };
    if (req.user && req.user._id) {
      query.user = mongoose.Types.ObjectId(req.user._id);
    }

    const result = await Reminder.updateMany(query, { $set: { status: "overdue" } });
    return res.json({ matched: result.matchedCount || result.n, modified: result.modifiedCount || result.nModified });
  } catch (err) {
    console.error("reconcileOverdue error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export default {
  createReminder,
  getReminder,
  listReminders,
  updateReminder,
  deleteReminder,
  markCompleted,
  reconcileOverdue,
};