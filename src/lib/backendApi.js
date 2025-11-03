export const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function sendOtp(email) {
  const res = await fetch(`${BACKEND_BASE}/api/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to send OTP");
  return data;
}

export async function verifyOtp(email, otp) {
  const res = await fetch(`${BACKEND_BASE}/api/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to verify OTP");
  return data;
}
