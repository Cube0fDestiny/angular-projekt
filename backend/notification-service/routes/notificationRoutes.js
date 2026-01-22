import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import { attachUserFromHeaders, requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(attachUserFromHeaders);
router.use(requireAuth);

// Get all notifications for the authenticated user
router.get("/", notificationController.getNotifications);

// Get unread notification count
router.get("/unread-count", notificationController.getUnreadCount);

// Mark a specific notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);

// Delete a specific notification
router.delete("/:id", notificationController.deleteNotification);

// Delete all notifications
router.delete("/", notificationController.deleteAllNotifications);

// Create a notification (for testing/internal use)
router.post("/", notificationController.createNotification);

export default router;
