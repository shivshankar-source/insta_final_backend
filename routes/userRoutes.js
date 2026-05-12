// routes/userRoutes.js

import express from "express";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import User from "../models/User.js";

import {
  searchUsers,
  getUserProfile,
  editProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getSavedPosts,
  getNotifications,
  markAllRead,
  uploadStory,
  getStories,
} from "../controllers/userController.js";

const router = express.Router();

// Search Users
router.get(
  "/search",
  protect,
  searchUsers
);

// Saved Posts
router.get(
  "/saved-posts",
  protect,
  getSavedPosts
);

// Notifications
router.get(
  "/notifications",
  protect,
  getNotifications
);

// Mark All Notifications Read
router.put(
  "/notifications/read-all",
  protect,
  markAllRead
);

// Get Stories
router.get(
  "/stories",
  protect,
  getStories
);

// Upload Story
router.post(
  "/stories",
  protect,
  upload.single("story"),
  uploadStory
);

// Edit Profile
router.put(
  "/edit-profile",
  protect,
  upload.single("profilePicture"),
  editProfile
);

// User Profile
router.get(
  "/:username/profile",
  protect,
  getUserProfile
);

// Follow / Unfollow User
router.put(
  "/:id/follow",
  protect,
  toggleFollow
);

// Followers
router.get(
  "/:id/followers",
  protect,
  getFollowers
);

// Following
router.get(
  "/:id/following",
  protect,
  getFollowing
);

// Admin - Get All Users
router.get(
  "/admin/all-users",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const users = await User.find({}, "-password").lean();

      res.json({ users });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

export default router;