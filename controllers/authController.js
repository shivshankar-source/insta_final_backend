import jwt from "jsonwebtoken";

import User from "../models/User.js";

const generateToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRE || "30d",
    }
  );

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message:
          "Username, email, and password are required",
      });
    }

    const exists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (exists) {
      return res.status(400).json({
        message:
          "Username or email already taken",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName: fullName || "",
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (
      !user ||
      !(await user.matchPassword(password))
    ) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Account has been deactivated",
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      bio: user.bio,
      website: user.website,
      location: user.location,
      followers: user.followers,
      following: user.following,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    )
      .select("-password")
      .populate(
        "followers",
        "username profilePicture"
      )
      .populate(
        "following",
        "username profilePicture"
      );

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export {
  register,
  login,
  getMe,
};