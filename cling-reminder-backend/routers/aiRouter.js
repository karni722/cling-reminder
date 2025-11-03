// routes/generateImage.js
import express from "express";
import { generateStabilityImage } from "../controllers/stabilityController.js";
const router = express.Router();
router.post("/", generateStabilityImage);
export default router;
