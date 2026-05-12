// routes/postRoutes.js

import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  createPost,
  getFeed,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
  toggleSave,
  explorePost,
} from "../controllers/postController.js";

const router = express.Router();

// Feed
router.get(
  "/feed",
  protect,
  getFeed
);

// Explore Posts
router.get(
  "/explore",
  protect,
  explorePost
);

// Create Post
router.post(
  "/",
  protect,
  upload.single("image"),
  createPost
);

// Get Single Post
router.get(
  "/:id",
  protect,
  getPost
);

// Delete Post
router.delete(
  "/:id",
  protect,
  deletePost
);

// Toggle Like
router.put(
  "/:id/like",
  protect,
  toggleLike
);

// Add Comment
router.post(
  "/:id/comments",
  protect,
  addComment
);

// Get Comments
router.get(
  "/:id/comments",
  protect,
  getComments
);

// Delete Comment
router.delete(
  "/:id/comments/:commentId",
  protect,
  deleteComment
);

// Toggle Save Post
router.put(
  "/:id/save",
  protect,
  toggleSave
);

export default router;