import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reelRoutes from "./routes/reelRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// __dirname setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in controllers
app.set("io", io);

// Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User Online
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);

    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  // Send Message
  socket.on("chat:send", ({ to, from, message, conversationId }) => {
    const recipientSocket = onlineUsers.get(to);

    if (recipientSocket) {
      io.to(recipientSocket).emit("chat:receive", {
        from,
        message,
        conversationId,
      });
    }
  });

  // Typing Start
  socket.on("typing:start", ({ to, from }) => {
    const recipientSocket = onlineUsers.get(to);

    if (recipientSocket) {
      io.to(recipientSocket).emit("typing:show", { from });
    }
  });

  // Typing Stop
  socket.on("typing:stop", ({ to }) => {
    const recipientSocket = onlineUsers.get(to);

    if (recipientSocket) {
      io.to(recipientSocket).emit("typing:hide");
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("users:online", Array.from(onlineUsers.keys()));

    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reels", reelRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

// ─── Database + Server Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);

    process.exit(1);
  });

export { app, io };