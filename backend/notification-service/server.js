import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import pino from "pino";
import pinoHttp from "pino-http";

import notificationRoutes from "./routes/notificationRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import * as db from "./db/index.js";
import { connectRabbitMQ, consumeNotifications } from "./utils/rabbitmq-client.js";

export const logger = pino({
  name: "NotificationService",
  transport: { target: "pino-pretty" },
});

const JWT_SECRET = process.env.JWT_SECRET;

// Store connected users for socket broadcasting
export const connectedUsers = new Map();

const startServer = async () => {
  await connectRabbitMQ();

  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  app.use("/notifications", notificationRoutes);

  const server = http.createServer(app);
  const io = new Server(server, {
    path: "/notifications/socket", // Explicit Socket.IO endpoint for gateway proxy
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // JWT authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token not provided."));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    logger.info(
      `[Socket.IO] User connected: ${socket.user.name} (ID: ${userId}). Socket ID: ${socket.id}`
    );

    // Store the socket connection for this user
    connectedUsers.set(userId, socket);

    // User joins their personal notification room
    socket.join(userId);

    // Handle custom events
    socket.on("markAsRead", async (notificationId) => {
      try {
        await db.query(
          `UPDATE "Notifications" SET is_read = true WHERE id = $1 AND user_id = $2`,
          [notificationId, userId]
        );
        logger.info(
          `[Socket.IO] Notification ${notificationId} marked as read by user ${userId}`
        );
      } catch (err) {
        logger.error(
          { error: err, userId, notificationId },
          "Error marking notification as read"
        );
        socket.emit("error", "Failed to mark notification as read");
      }
    });

    socket.on("deleteNotification", async (notificationId) => {
      try {
        await db.query(
          `DELETE FROM "Notifications" WHERE id = $1 AND user_id = $2`,
          [notificationId, userId]
        );
        logger.info(
          `[Socket.IO] Notification ${notificationId} deleted by user ${userId}`
        );
        socket.emit("notificationDeleted", { notificationId });
      } catch (err) {
        logger.error(
          { error: err, userId, notificationId },
          "Error deleting notification"
        );
        socket.emit("error", "Failed to delete notification");
      }
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      logger.info(`[Socket.IO] User disconnected: ${userId}`);
    });
  });

  // Start consuming notifications from RabbitMQ
  await consumeNotifications(io);

  app.set("io", io);

  app.use(errorHandler);

  const PORT = process.env.PORT || 3007;
  server.listen(PORT, () =>
    logger.info(`🚀 Notification-Service running on port ${PORT}`)
  );
};

startServer().catch((err) => {
  logger.fatal({ error: err }, "Notification-Service failed to start");
  process.exit(1);
});
