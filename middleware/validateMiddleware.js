// middleware/validateMiddleware.js

// Lightweight Input Validation
// No external library required

// Register Validation
const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  const errors = [];

  if (!username || username.trim().length < 3) {
    errors.push(
      "Username must be at least 3 characters"
    );
  }

  if (
    username &&
    !/^[a-zA-Z0-9._]+$/.test(username)
  ) {
    errors.push(
      "Username can only contain letters, numbers, dots, and underscores"
    );
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.push("Valid email is required");
  }

  if (!password || password.length < 6) {
    errors.push(
      "Password must be at least 6 characters"
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors[0],
      errors,
    });
  }

  // Sanitize
  req.body.username = username
    .trim()
    .toLowerCase();

  req.body.email = email
    .trim()
    .toLowerCase();

  next();
};

// Login Validation
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  req.body.email = email
    .trim()
    .toLowerCase();

  next();
};

// Comment Validation
const validateComment = (req, res, next) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      message: "Comment text cannot be empty",
    });
  }

  if (text.length > 2200) {
    return res.status(400).json({
      message:
        "Comment must be under 2200 characters",
    });
  }

  req.body.text = text.trim();

  next();
};

// Post Validation
const validatePost = (req, res, next) => {
  const { caption } = req.body;

  if (caption && caption.length > 2200) {
    return res.status(400).json({
      message:
        "Caption must be under 2200 characters",
    });
  }

  next();
};

// Message Validation
const validateMessage = (req, res, next) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      message: "Message cannot be empty",
    });
  }

  if (text.length > 2000) {
    return res.status(400).json({
      message:
        "Message must be under 2000 characters",
    });
  }

  req.body.text = text.trim();

  next();
};

export {
  validateRegister,
  validateLogin,
  validateComment,
  validatePost,
  validateMessage,
};