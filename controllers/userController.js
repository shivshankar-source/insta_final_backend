// controllers/userController.js

import User from "../models/User.js";

import Post from "../models/Post.js";

// @route GET /api/users/search?q=
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        message: "Query required",
      });
    }

    const escaped = query.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      escaped,
      "i"
    );

    const users = await User.find(
      {
        $or: [
          { username: regex },
          { fullName: regex },
        ],

        _id: {
          $ne: req.user._id,
        },

        isActive: true,
      },

      "username profilePicture fullName followers"
    )
      .limit(20)
      .lean();

    const currentFollowing =
      req.user.following.map(String);

    const result = users.map((u) => ({
      ...u,

      followerCount:
        u.followers.length,

      isFollowing:
        currentFollowing.includes(
          String(u._id)
        ),
    }));

    res.json({ users: result });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/users/:username/profile
const getUserProfile = async (
  req,
  res
) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    })
      .select(
        "-password -notifications"
      )
      .populate(
        "followers",
        "username profilePicture"
      )
      .populate(
        "following",
        "username profilePicture"
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const posts = await Post.find({
      user: user._id,
    })
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "username profilePicture"
      );

    const isFollowing =
      req.user.following
        .map(String)
        .includes(String(user._id));

    res.json({
      user,
      posts,
      isFollowing,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route PUT /api/users/edit-profile
const editProfile = async (req, res) => {
  try {
    const {
      fullName,
      bio,
      website,
      location,
      username,
    } = req.body;

    const updateData = {
      fullName,
      bio,
      website,
      location,
    };

    if (
      username &&
      username !== req.user.username
    ) {
      const exists =
        await User.findOne({
          username,
        });

      if (exists) {
        return res.status(400).json({
          message:
            "Username already taken",
        });
      }

      updateData.username = username;
    }

    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const user =
      await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        {
          new: true,
        }
      ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route PUT /api/users/:id/follow
const toggleFollow = async (
  req,
  res
) => {
  try {
    const targetId = req.params.id;

    if (
      String(targetId) ===
      String(req.user._id)
    ) {
      return res.status(400).json({
        message:
          "You cannot follow yourself",
      });
    }

    const targetUser =
      await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const currentUser =
      await User.findById(req.user._id);

    const isFollowing =
      currentUser.following.includes(
        targetId
      );

    if (isFollowing) {
      currentUser.following.pull(
        targetId
      );

      targetUser.followers.pull(
        req.user._id
      );
    } else {
      currentUser.following.push(
        targetId
      );

      targetUser.followers.push(
        req.user._id
      );

      await User.findByIdAndUpdate(
        targetId,
        {
          $push: {
            notifications: {
              type: "follow",
              from: req.user._id,
              message: `${currentUser.username} started following you`,
            },
          },
        }
      );
    }

    await Promise.all([
      currentUser.save(),
      targetUser.save(),
    ]);

    res.json({
      following: !isFollowing,

      followerCount:
        targetUser.followers.length,

      followingCount:
        currentUser.following.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/users/:id/followers
const getFollowers = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.params.id
    ).populate(
      "followers",
      "username profilePicture fullName"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      followers: user.followers,
      count: user.followers.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/users/:id/following
const getFollowing = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.params.id
    ).populate(
      "following",
      "username profilePicture fullName"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      following: user.following,
      count: user.following.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/users/saved-posts
const getSavedPosts = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user._id
    ).populate({
      path: "savedPosts",

      populate: {
        path: "user",
        select:
          "username profilePicture",
      },

      options: {
        sort: {
          createdAt: -1,
        },
      },
    });

    res.json({
      posts: user.savedPosts,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/users/notifications
const getNotifications = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user._id
    )
      .select("notifications")
      .populate(
        "notifications.from",
        "username profilePicture"
      );

    const sorted =
      user.notifications
        .sort(
          (a, b) =>
            b.createdAt - a.createdAt
        )
        .slice(0, 50);

    const unreadCount = sorted.filter(
      (n) => !n.read
    ).length;

    res.json({
      notifications: sorted,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route PUT /api/users/notifications/read-all
const markAllRead = async (
  req,
  res
) => {
  try {
    await User.updateOne(
      {
        _id: req.user._id,
      },
      {
        $set: {
          "notifications.$[].read":
            true,
        },
      }
    );

    res.json({
      message:
        "All notifications marked as read",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route POST /api/users/stories
const uploadStory = async (
  req,
  res
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "Story image required",
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const user = await User.findById(
      req.user._id
    );

    user.stories.push({
      image: imageUrl,

      expiresAt: new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      ),
    });

    await user.save();

    res.status(201).json({
      story:
        user.stories[
          user.stories.length - 1
        ],
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/users/stories
const getStories = async (
  req,
  res
) => {
  try {
    const currentUser =
      await User.findById(
        req.user._id
      ).select("following");

    const watchList = [
      ...currentUser.following,
      req.user._id,
    ];

    const now = new Date();

    const users = await User.find(
      {
        _id: {
          $in: watchList,
        },

        "stories.expiresAt": {
          $gte: now,
        },
      },

      "username profilePicture stories"
    ).lean();

    const result = users
      .map((u) => ({
        user: {
          _id: u._id,
          username: u.username,
          profilePicture:
            u.profilePicture,
        },

        stories: u.stories.filter(
          (s) =>
            new Date(s.expiresAt) >=
            now
        ),
      }))
      .filter(
        (u) => u.stories.length > 0
      );

    res.json({
      stories: result,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export {
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
};