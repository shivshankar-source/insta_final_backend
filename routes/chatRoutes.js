// routes/chatRoutes.js

import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// Get all conversations
router.get(
  "/conversations",
  protect,
  getConversations
);

// Create or get existing conversation
router.post(
  "/conversations/:userId",
  protect,
  getOrCreateConversation
);

// Get messages of a conversation
router.get(
  "/conversations/:conversationId/messages",
  protect,
  getMessages
);

// Send message
router.post(
  "/conversations/:conversationId/messages",
  protect,
  sendMessage
);

export default router;