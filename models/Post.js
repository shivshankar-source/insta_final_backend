import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
      maxlength: 2200,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        text: {
          type: String,
          required: true,
          maxlength: 2200,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.virtual("likeCount").get(
  function () {
    return this.likes.length;
  }
);

postSchema.virtual("commentCount").get(
  function () {
    return this.comments.length;
  }
);

postSchema.set("toJSON", {
  virtuals: true,
});

postSchema.set("toObject", {
  virtuals: true,
});

const Post = mongoose.model(
  "Post",
  postSchema
);

export default Post;