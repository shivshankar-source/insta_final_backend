import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    video: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      maxlength: 2200,
      default: "",
    },

    audio: {
      type: String,
      default: "Original audio",
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
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "User",

          required: true,
        },

        text: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    views: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Reel = mongoose.model(
  "Reel",
  reelSchema
);

export default Reel;