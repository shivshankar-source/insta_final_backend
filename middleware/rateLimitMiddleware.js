// middleware/rateLimitMiddleware.js

// Simple in-memory rate limiter
// Replace with Redis-based limiter in production

const requestCounts = new Map();

/**
 * Create Rate Limiter Middleware
 *
 * @param {number} windowMs
 * @param {number} max
 * @param {string} message
 */

const createRateLimiter = (
  windowMs = 60_000,
  max = 100,
  message = "Too many requests, please try again later."
) => {
  // Cleanup old records every 5 minutes
  setInterval(() => {
    const now = Date.now();

    for (const [key, data] of requestCounts.entries()) {
      if (now - data.startTime > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  return (req, res, next) => {
    const key = req.ip + ":" + req.path;

    const now = Date.now();

    const record = requestCounts.get(key);

    // New Record
    if (!record || now - record.startTime > windowMs) {
      requestCounts.set(key, {
        count: 1,
        startTime: now,
      });

      return next();
    }

    // Existing Record
    record.count++;

    if (record.count > max) {
      return res.status(429).json({
        message,
      });
    }

    next();
  };
};

// Auth Limiter
const authLimiter = createRateLimiter(
  15 * 60_000,
  10,
  "Too many login attempts. Try again in 15 minutes."
);

// Upload Limiter
const uploadLimiter = createRateLimiter(
  60 * 60_000,
  20,
  "Too many uploads. Try again in an hour."
);

// General Limiter
const generalLimiter = createRateLimiter(
  60_000,
  200,
  "Too many requests."
);

export {
  createRateLimiter,
  authLimiter,
  uploadLimiter,
  generalLimiter,
};