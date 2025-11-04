// controllers/stabilityController.js
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL =
  process.env.STABILITY_API_URL ||
  "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
const SAVE_IMAGE = (process.env.SAVE_IMAGE || "false").toLowerCase() === "true";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

if (!STABILITY_API_KEY) {
  console.warn("Warning: STABILITY_API_KEY not set in .env");
}

// helper: save buffer to disk and return public URL
function saveBuffer(buffer, ext = "png") {
  const uploadsDir = path.join(process.cwd(), "uploads", "generated-images");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `stability_${Date.now()}_${uuidv4()}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);
  const publicUrl = PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/uploads/generated-images/${filename}` : `/uploads/generated-images/${filename}`;
  return { filename, filepath, publicUrl };
}

// helper: download remote image url into buffer (returns {buffer, ext})
async function downloadRemoteImage(uri) {
  const resp = await axios.get(uri, { responseType: "arraybuffer", timeout: 120000 });
  const contentType = resp.headers["content-type"] || "";
  let ext = "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("gif")) ext = "gif";
  return { buffer: Buffer.from(resp.data), ext };
}

export async function generateStabilityImage(req, res) {
  try {
    const { prompt, width = 1024, height = 1024, samples = 1, cfg_scale = 7 } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "prompt is required and must be non-empty string" });
    }

    if (!STABILITY_API_KEY) {
      return res.status(500).json({ error: "STABILITY_API_KEY missing in server .env" });
    }

    // Prepare payload for Stability endpoint - adjust keys if Stability updates API
    const payload = {
      text_prompts: [{ text: prompt }],
      cfg_scale: Number(cfg_scale),
      height: Number(height),
      width: Number(width),
      samples: Number(samples)
    };

    const response = await axios.post(STABILITY_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${STABILITY_API_KEY}`,
      },
      responseType: "json",
      timeout: 120000, // 2 minutes
    });

    const data = response.data || {};

    // Common places where image data could be present:
    // - data.artifacts[0].base64
    // - data.artifacts[0].b64_json
    // - data.output[0].b64_json
    // - data.artifacts[0].url (or similar)
    // Defensive extraction:
    let base64 = null;
    let remoteUrl = null;

    if (data.artifacts && Array.isArray(data.artifacts) && data.artifacts.length > 0) {
      const a0 = data.artifacts[0];
      base64 = a0.base64 || a0.b64_json || a0.b64 || null;
      remoteUrl = a0.url || a0.uri || null;
    }

    // alternate shapes
    if (!base64 && data.output && Array.isArray(data.output) && data.output.length > 0) {
      base64 = data.output[0]?.b64_json || data.output[0]?.base64 || null;
      remoteUrl = data.output[0]?.url || data.output[0]?.uri || remoteUrl;
    }

    // fallback: data[0] style
    if (!base64 && Array.isArray(data) && data.length > 0) {
      base64 = data[0]?.b64_json || data[0]?.base64 || null;
      remoteUrl = data[0]?.url || remoteUrl;
    }

    // If remote URL present and caller asked to save on server, download & save
    if (remoteUrl) {
      if (SAVE_IMAGE) {
        try {
          const { buffer, ext } = await downloadRemoteImage(remoteUrl);
          const saved = saveBuffer(buffer, ext);
          return res.status(201).json({ message: "generated and saved", url: saved.publicUrl, filename: saved.filename, prompt });
        } catch (e) {
          // if download fails, still return remoteUrl to client
          console.warn("Failed to download remoteUrl, returning remoteUrl:", e?.message || e);
          return res.status(200).json({ url: remoteUrl, prompt, note: "remoteUrl returned (download failed)" });
        }
      } else {
        return res.status(200).json({ url: remoteUrl, prompt });
      }
    }

    // If base64 present
    if (base64 && typeof base64 === "string") {
      // sometimes base64 is JSON-stringified; try parse
      let maybe = base64.trim();
      if ((maybe.startsWith("{") || maybe.startsWith("["))) {
        try {
          const parsed = JSON.parse(maybe);
          maybe = parsed?.b64_json || parsed?.base64 || maybe;
        } catch (e) {
          // ignore parse error
        }
      }
      // final base64 string expected
      if (!maybe || typeof maybe !== "string") {
        return res.status(500).json({ error: "Invalid base64 data in Stability response", raw: data });
      }

      if (SAVE_IMAGE) {
        const buffer = Buffer.from(maybe, "base64");
        const saved = saveBuffer(buffer, "png"); // assume png (adjust if needed)
        return res.status(201).json({ message: "generated and saved", url: saved.publicUrl, filename: saved.filename, prompt });
      } else {
        return res.status(201).json({ message: "generated", dataUrl: `data:image/png;base64,${maybe}`, prompt });
      }
    }

    // If nothing found - return raw response for debugging
    return res.status(200).json({ message: "No image found in response", raw: data });
  } catch (err) {
    console.error("Stability Generation Error:", err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    const detail = err?.response?.data || err?.message || String(err);
    return res.status(status).json({ error: "Image generation failed", detail });
  }
}
