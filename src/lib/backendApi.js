import axios from "axios";

export const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

export const api = axios.create({ baseURL: BACKEND_BASE, withCredentials: true });

export async function sendOtp(email) {
  const { data } = await api.post("/api/send-otp", { email });
  return data;
}

export async function verifyOtp(email, otp) {
  const { data } = await api.post("/api/verify-otp", { email, otp });
  return data;
}

export async function getUserInfo() {
  const { data } = await api.get("/api/dashboard/userinfo");
  return data;
}

export async function getReminders(params = {}) {
  const { data } = await api.get("/api/reminders", { params });
  return data;
}

export async function createReminder(payload) {
  const { data } = await api.post("/api/reminders", payload);
  return data;
}

// Stability SDXL allowed sizes include 1024x1024; use that as default
export async function generateImage({ prompt, width = 1024, height = 1024, samples = 1, cfg_scale = 7 }) {
  const { data } = await api.post("/api/generate-image", { prompt, width, height, samples, cfg_scale });
  return data; // may include { url } or { dataUrl }
}

export async function deleteReminder(id) {
  const { data } = await api.delete(`/api/reminders/${id}`);
  return data;
}
