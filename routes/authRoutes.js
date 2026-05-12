// routes/authRoutes.js

import express from "express";

import {
  register,
  login,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

import {
  validateRegister,
  validateLogin,
} from "../middleware/validateMiddleware.js";

import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Register
router.post(
  "/register",
  authLimiter,
  validateRegister,
  register
);

// Login
router.post(
  "/login",
  authLimiter,
  validateLogin,
  login
);

// Current Logged In User
router.get(
  "/me",
  protect,
  getMe
);

export default router;