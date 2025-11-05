import nodemailer from "nodemailer";

const OTP_TTL_MIN = 10;
const RATE_LIMIT_MIN = 1;

async function sendEmail(to, subject, text, html) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.FROM_EMAIL) {
    throw new Error("Missing SMTP env: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/FROM_EMAIL");
  }
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });

  return info;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST handler that tries a couple of likely import locations for your controller.
 * If none found, returns a helpful JSON error so the build doesn't just fail silently.
 */
export async function POST(req) {
  let sendOtp;

  // try a few likely module locations (adjust/remove as needed)
  const candidates = [
    // controller inside src (recommended) — if you move controller to src/backend/...
    "../../../backend/controller/sendOtpControllers.js",
    // controller at project root backend folder (what you attempted)
    "../../../../backend/controller/sendOtpControllers.js",
    // alternative: src/lib/controller...
    "../../../lib/controller/sendOtpControllers.js",
    // add other common paths your project might use
  ];

  let lastErr = null;
  for (const p of candidates) {
    try {
      const mod = await import(p);
      if (mod && (mod.sendOtp || mod.default)) {
        sendOtp = mod.sendOtp ?? mod.default;
        break;
      }
    } catch (err) {
      lastErr = err;
      // continue to next candidate
    }
  }

  if (!sendOtp) {
    console.error("Could not import sendOtp controller. Tried:", candidates, lastErr);
    return new Response(JSON.stringify({
      success: false,
      error: "sendOtp controller not found. Move controller inside src/ or fix import path. See server logs for details."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await sendOtp(req, {
      sendEmail,
      generateOtp,
      OTP_TTL_MIN,
      RATE_LIMIT_MIN,
    });

    if (result instanceof Response) return result;

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sendOtp handler error:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || "Internal error" }), {
      status: err?.statusCode || 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
