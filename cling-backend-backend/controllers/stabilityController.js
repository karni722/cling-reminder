import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Ensure .env from backend folder is loaded even if app started from monorepo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const STABILITY_API_KEY = process.env.STABILITY_API_KEY || process.env.STABILITY_API;
const STABILITY_API_URL =
  process.env.STABILITY_API_URL ||
  "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
const SAVE_IMAGE = (process.env.SAVE_IMAGE || "false").toLowerCase() === "true";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

if (!STABILITY_API_KEY) {
  console.warn("Warning: STABILITY_API_KEY (or STABILITY_API) not set in backend .env");
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
    // Collect multiple images (urls or base64) if present
    const collected = [];

    // Prefer artifacts array
    if (Array.isArray(data?.artifacts) && data.artifacts.length > 0) {
      for (const art of data.artifacts) {
        const b64 = art.base64 || art.b64_json || art.b64 || null;
        const url = art.url || art.uri || null;
        if (url) {
          if (SAVE_IMAGE) {
            try {
              const { buffer, ext } = await downloadRemoteImage(url);
              const saved = saveBuffer(buffer, ext);
              collected.push(saved.publicUrl);
            } catch (e) {
              collected.push(url);
            }
          } else {
            collected.push(url);
          }
        } else if (b64 && typeof b64 === "string") {
          let maybe = b64.trim();
          if ((maybe.startsWith("{") || maybe.startsWith("["))) {
            try {
              const parsed = JSON.parse(maybe);
              maybe = parsed?.b64_json || parsed?.base64 || maybe;
            } catch {}
          }
          if (maybe && typeof maybe === "string") {
            if (SAVE_IMAGE) {
              const buffer = Buffer.from(maybe, "base64");
              const saved = saveBuffer(buffer, "png");
              collected.push(saved.publicUrl);
            } else {
              collected.push(`data:image/png;base64,${maybe}`);
            }
          }
        }
      }
    }

    // Alternate output shape
    if (collected.length === 0 && Array.isArray(data?.output) && data.output.length > 0) {
      for (const out of data.output) {
        const b64 = out?.b64_json || out?.base64 || null;
        const url = out?.url || out?.uri || null;
        if (url) collected.push(url);
        else if (b64) collected.push(`data:image/png;base64,${b64}`);
      }
    }

    // Fallback array-like
    if (collected.length === 0 && Array.isArray(data) && data.length > 0) {
      for (const item of data) {
        const b64 = item?.b64_json || item?.base64 || null;
        const url = item?.url || null;
        if (url) collected.push(url);
        else if (b64) collected.push(`data:image/png;base64,${b64}`);
      }
    }

    if (collected.length > 0) {
      // Limit to requested samples if caller asked
      const limited = collected.slice(0, Number(samples) || collected.length);
      return res.status(200).json({ prompt, urls: limited });
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
