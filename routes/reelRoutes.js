// routes/reelRoutes.js

import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  createReel,
  getReels,
  toggleReelLike,
} from "../controllers/reelController.js";

const router = express.Router();

// Get Reels
router.get(
  "/",
  protect,
  getReels
);

// Create Reel
router.post(
  "/",
  protect,
  upload.single("video"),
  createReel
);

// Toggle Reel Like
router.put(
  "/:id/like",
  protect,
  toggleReelLike
);

export default router;