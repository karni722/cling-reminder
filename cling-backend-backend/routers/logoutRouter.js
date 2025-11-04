import express from "express";

const router = express.Router();

router.post("/", (req, res) => {
  try {
    res.setHeader("Set-Cookie", "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    return res.json({ ok: true, message: "Logged out" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Logout failed" });
  }
});

export default router;



