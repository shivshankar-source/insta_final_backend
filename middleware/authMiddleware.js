// middleware/authMiddleware.js

import jwt from "jsonwebtoken";

import User from "../models/User.js";

// Protect Routes
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated. Token missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account deactivated",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// Role Authorization
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required: ${roles.join(
          " or "
        )}`,
      });
    }

    next();
  };

export { protect, authorize };