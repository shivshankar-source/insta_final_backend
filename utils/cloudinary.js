// utils/cloudinary.js

// Optional: Use Cloudinary for cloud image/video storage
// Add CLOUDINARY_* variables in .env

import { v2 as cloudinary } from "cloudinary";

import { CloudinaryStorage } from "multer-storage-cloudinary";

import multer from "multer";

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage Config
const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");

    return {
      folder: isVideo
        ? "instagram-clone/reels"
        : "instagram-clone/posts",

      resource_type: isVideo ? "video" : "image",

      allowed_formats: isVideo
        ? ["mp4", "mov", "avi", "webm"]
        : ["jpg", "jpeg", "png", "gif", "webp"],

      transformation: isVideo
        ? [{ quality: "auto" }]
        : [
            {
              width: 1080,
              height: 1080,
              crop: "limit",
              quality: "auto",
            },
          ],
    };
  },
});

// Multer Upload
const uploadCloud = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export { cloudinary, uploadCloud };