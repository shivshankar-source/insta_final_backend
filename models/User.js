import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String, required: true, unique: true, trim: true,
      minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9._]+$/,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    fullName: { type: String, default: "", maxlength: 60 },
    bio: { type: String, default: "", maxlength: 150 },
    profilePicture: { type: String, default: "" },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    role: { type: String, enum: ["user", "admin"], default: "user" },
    stories: [{
      image: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    }],
    notifications: [{
      type: { type: String, enum: ["like", "comment", "follow"], required: true },
      from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
      message: { type: String },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual("followerCount").get(function () { return this.followers.length; });
userSchema.virtual("followingCount").get(function () { return this.following.length; });
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
