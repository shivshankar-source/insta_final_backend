// controllers/reelController.js

import Reel from "../models/Reel.js";

import User from "../models/User.js";

// @route POST /api/reels
const createReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Video file required",
      });
    }

    const { caption, audio } = req.body;

    const reel = await Reel.create({
      user: req.user._id,

      video: `/uploads/${req.file.filename}`,

      caption: caption || "",

      audio: audio || "Original audio",
    });

    await reel.populate(
      "user",
      "username profilePicture"
    );

    res.status(201).json(reel);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/reels
const getReels = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page) || 1;

    const limit = 5;

    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "user",
        "username profilePicture"
      )
      .lean();

    const currentUserId = String(
      req.user._id
    );

    const enriched = reels.map((r) => ({
      ...r,

      likeCount: r.likes.length,

      liked: r.likes
        .map(String)
        .includes(currentUserId),
    }));

    res.json({
      reels: enriched,
      page,
      hasMore: reels.length === limit,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route PUT /api/reels/:id/like
const toggleReelLike = async (
  req,
  res
) => {
  try {
    const reel = await Reel.findById(
      req.params.id
    );

    if (!reel) {
      return res.status(404).json({
        message: "Reel not found",
      });
    }

    const alreadyLiked =
      reel.likes.includes(req.user._id);

    if (alreadyLiked) {
      reel.likes.pull(req.user._id);
    } else {
      reel.likes.push(req.user._id);
    }

    await reel.save();

    res.json({
      liked: !alreadyLiked,
      likeCount: reel.likes.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export {
  createReel,
  getReels,
  toggleReelLike,
};