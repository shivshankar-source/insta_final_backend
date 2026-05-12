// middleware/uploadMiddleware.js

import multer from "multer";

import path from "path";

import fs from "fs";

import { fileURLToPath } from "url";

// __dirname setup for ES Modules
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// Use Local Storage
// Replace with Cloudinary in production

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    cb(
      null,
      `${unique}${path.extname(file.originalname)}`
    );
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;

  const ext = path
    .extname(file.originalname)
    .toLowerCase();

  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only images and videos are allowed"),
      false
    );
  }
};

// Upload Middleware
const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export default upload;