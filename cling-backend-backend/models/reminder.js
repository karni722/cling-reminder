import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  
  // --- NAYA FIELD FOR AI IMAGE URL ADDED ---
  icon_image_url: { type: String }, 
  // -----------------------------------------
  
  date: { type: Date },
  time: { type: String },
  device: { type: String },
  category: { type: String },
  status: { type: String, enum: ["upcoming", "completed", "overdue"], default: "upcoming", index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);