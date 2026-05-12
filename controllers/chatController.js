// controllers/chatController.js

import {
  Message,
  Conversation,
} from "../models/Message.js";

import User from "../models/User.js";

// @route GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const conversations =
      await Conversation.find({
        participants: req.user._id,
      })
        .populate(
          "participants",
          "username profilePicture fullName"
        )
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route POST /api/chat/conversations/:userId
const getOrCreateConversation = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    let conversation =
      await Conversation.findOne({
        participants: {
          $all: [req.user._id, userId],
          $size: 2,
        },
      }).populate(
        "participants",
        "username profilePicture fullName"
      );

    // Create Conversation
    if (!conversation) {
      conversation =
        await Conversation.create({
          participants: [
            req.user._id,
            userId,
          ],
        });

      await conversation.populate(
        "participants",
        "username profilePicture fullName"
      );
    }

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/chat/conversations/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page) || 1;

    const limit = 30;

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation:
        req.params.conversationId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "sender",
        "username profilePicture"
      );

    res.json({
      messages: messages.reverse(),
      page,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route POST /api/chat/conversations/:conversationId/messages
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        message: "Message text required",
      });
    }

    const message = await Message.create({
      conversation:
        req.params.conversationId,

      sender: req.user._id,

      text: text.trim(),
    });

    await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        lastMessage: message._id,
      }
    );

    await message.populate(
      "sender",
      "username profilePicture"
    );

    res.status(201).json({
      message,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
};