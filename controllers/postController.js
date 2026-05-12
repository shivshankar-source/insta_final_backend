import Post from "../models/Post.js";
import User from "../models/User.js";

// @route POST /api/posts
const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Post image required",
      });
    }

    const { caption, location, tags } = req.body;

    const imageUrl = `/uploads/${req.file.filename}`;

    const post = await Post.create({
      user: req.user._id,
      image: imageUrl,
      caption: caption || "",
      location: location || "",
      tags: tags
        ? tags.split(",").map((t) => t.trim())
        : [],
    });

    await post.populate(
      "user",
      "username profilePicture"
    );

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/posts/feed?page=1&limit=10
const getFeed = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const currentUser =
      await User.findById(req.user._id).select(
        "following"
      );

    const feedUsers = [
      ...currentUser.following,
      req.user._id,
    ];

    const total =
      await Post.countDocuments({
        user: { $in: feedUsers },
      });

    const posts = await Post.find({
      user: { $in: feedUsers },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "user",
        "username profilePicture"
      )
      .populate(
        "comments.user",
        "username profilePicture"
      )
      .lean();

    const currentUserId = String(
      req.user._id
    );

    const enriched = posts.map((p) => ({
      ...p,
      likeCount: p.likes.length,
      commentCount: p.comments.length,
      liked: p.likes
        .map(String)
        .includes(currentUserId),
      saved:
        p.savedBy
          ?.map(String)
          .includes(currentUserId) || false,
    }));

    res.json({
      posts: enriched,
      page,
      totalPages: Math.ceil(
        total / limit
      ),
      hasMore: page * limit < total,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/posts/:id
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    )
      .populate(
        "user",
        "username profilePicture fullName"
      )
      .populate(
        "comments.user",
        "username profilePicture"
      );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const currentUserId = String(
      req.user._id
    );

    res.json({
      ...post.toObject(),

      liked: post.likes
        .map(String)
        .includes(currentUserId),

      saved: post.savedBy
        .map(String)
        .includes(currentUserId),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (
      String(post.user) !==
        String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await post.deleteOne();

    await User.updateMany(
      {},
      {
        $pull: {
          savedPosts: post._id,
        },
      }
    );

    res.json({
      message: "Post deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route PUT /api/posts/:id/like
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userId = req.user._id;

    const alreadyLiked =
      post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);

      if (
        String(post.user) !==
        String(userId)
      ) {
        await User.findByIdAndUpdate(
          post.user,
          {
            $push: {
              notifications: {
                type: "like",
                from: userId,
                post: post._id,
                message: `${req.user.username} liked your post`,
              },
            },
          }
        );

        const io = req.app.get("io");

        io
          ?.to(String(post.user))
          .emit("notification:new", {
            type: "like",
            from: req.user.username,
          });
      }
    }

    await post.save();

    res.json({
      liked: !alreadyLiked,
      likeCount: post.likes.length,
      likes: post.likes,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route POST /api/posts/:id/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        message: "Comment text required",
      });
    }

    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();

    await post.populate(
      "comments.user",
      "username profilePicture"
    );

    const addedComment =
      post.comments[
        post.comments.length - 1
      ];

    if (
      String(post.user) !==
      String(req.user._id)
    ) {
      await User.findByIdAndUpdate(
        post.user,
        {
          $push: {
            notifications: {
              type: "comment",
              from: req.user._id,
              post: post._id,
              message: `${req.user.username} commented: "${text.slice(
                0,
                60
              )}"`,
            },
          },
        }
      );
    }

    res.status(201).json({
      comment: addedComment,
      commentCount:
        post.comments.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/posts/:id/comments
const getComments = async (req, res) => {
  try {
    const post = await Post.findById(
      req.params.id
    ).populate(
      "comments.user",
      "username profilePicture fullName"
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.json({
      comments: post.comments,
      commentCount:
        post.comments.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route DELETE /api/posts/:id/comments/:commentId
const deleteComment = async (
  req,
  res
) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(
      req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const canDelete =
      String(comment.user) ===
        String(req.user._id) ||
      String(post.user) ===
        String(req.user._id) ||
      req.user.role === "admin";

    if (!canDelete) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    comment.deleteOne();

    await post.save();

    res.json({
      message: "Comment deleted",
      commentCount:
        post.comments.length,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route PUT /api/posts/:id/save
const toggleSave = async (req, res) => {
  try {
    const postId = req.params.id;

    const userId = req.user._id;

    const post = await Post.findById(
      postId
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const user = await User.findById(
      userId
    );

    const alreadySaved =
      user.savedPosts.includes(postId);

    if (alreadySaved) {
      user.savedPosts.pull(postId);

      post.savedBy.pull(userId);
    } else {
      user.savedPosts.push(postId);

      post.savedBy.push(userId);
    }

    await Promise.all([
      user.save(),
      post.save(),
    ]);

    res.json({
      saved: !alreadySaved,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/posts/explore
const explorePost = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 12;

    const skip = (page - 1) * limit;

    const total =
      await Post.countDocuments();

    const posts = await Post.find()
      .sort({
        likes: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate(
        "user",
        "username profilePicture"
      )
      .lean();

    res.json({
      posts,
      page,
      totalPages: Math.ceil(
        total / limit
      ),
      hasMore: page * limit < total,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export {
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
};