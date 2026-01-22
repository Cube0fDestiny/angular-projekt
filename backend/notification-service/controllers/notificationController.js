import { publishEvent } from "../utils/rabbitmq-client.js";
import * as db from "../db/index.js";

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await db.query(
      `SELECT * FROM "Notifications"
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM "Notifications" WHERE user_id = $1`,
      [userId]
    );

    log.info(
      { userId, count: result.rows.length },
      "Retrieved notifications for user"
    );

    res.status(200).json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (err) {
    log.error(
      { error: err, userId },
      "Error retrieving notifications"
    );
    res.status(500).json({
      error: "Error retrieving notifications",
      message: err.message,
    });
  }
};

/**
 * Get unread notification count for the authenticated user
 */
export const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const result = await db.query(
      `SELECT COUNT(*) FROM "Notifications"
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    const unreadCount = parseInt(result.rows[0].count);

    log.info(
      { userId, unreadCount },
      "Retrieved unread notification count"
    );

    res.status(200).json({
      unreadCount,
    });
  } catch (err) {
    log.error(
      { error: err, userId },
      "Error retrieving unread notification count"
    );
    res.status(500).json({
      error: "Error retrieving unread count",
      message: err.message,
    });
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  const log = req.log;

  try {
    const result = await db.query(
      `UPDATE "Notifications"
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    log.info(
      { userId, notificationId },
      "Marked notification as read"
    );

    res.status(200).json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (err) {
    log.error(
      { error: err, userId, notificationId },
      "Error marking notification as read"
    );
    res.status(500).json({
      error: "Error marking notification as read",
      message: err.message,
    });
  }
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const result = await db.query(
      `UPDATE "Notifications"
       SET is_read = true
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [userId]
    );

    log.info(
      { userId, count: result.rowCount },
      "Marked all notifications as read"
    );

    res.status(200).json({
      message: `Marked ${result.rowCount} notifications as read`,
      count: result.rowCount,
    });
  } catch (err) {
    log.error(
      { error: err, userId },
      "Error marking all notifications as read"
    );
    res.status(500).json({
      error: "Error marking all notifications as read",
      message: err.message,
    });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  const log = req.log;

  try {
    const result = await db.query(
      `DELETE FROM "Notifications"
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    log.info(
      { userId, notificationId },
      "Deleted notification"
    );

    res.status(200).json({
      message: "Notification deleted",
      notificationId,
    });
  } catch (err) {
    log.error(
      { error: err, userId, notificationId },
      "Error deleting notification"
    );
    res.status(500).json({
      error: "Error deleting notification",
      message: err.message,
    });
  }
};

/**
 * Delete all notifications for the authenticated user
 */
export const deleteAllNotifications = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const result = await db.query(
      `DELETE FROM "Notifications"
       WHERE user_id = $1
       RETURNING id`,
      [userId]
    );

    log.info(
      { userId, count: result.rowCount },
      "Deleted all notifications"
    );

    res.status(200).json({
      message: `Deleted ${result.rowCount} notifications`,
      count: result.rowCount,
    });
  } catch (err) {
    log.error(
      { error: err, userId },
      "Error deleting all notifications"
    );
    res.status(500).json({
      error: "Error deleting all notifications",
      message: err.message,
    });
  }
};

/**
 * Create a notification (for testing/internal use)
 */
export const createNotification = async (req, res) => {
  const { userId, type, title, message, data } = req.body;
  const log = req.log;

  if (!userId || !title) {
    return res.status(400).json({
      error: "Missing required fields: userId, title",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO "Notifications" (user_id, type, title, message, data, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING *`,
      [
        userId,
        type || "general",
        title,
        message || "",
        JSON.stringify(data || {}),
      ]
    );

    const notification = result.rows[0];

    // Publish event to RabbitMQ for other services to consume if needed
    try {
      await publishEvent("notification.created", {
        notificationId: notification.id,
        userId,
        type: notification.type,
        title: notification.title,
      });
    } catch (mqErr) {
      log.warn({ error: mqErr }, "Failed to publish notification event to RabbitMQ");
    }

    log.info(
      { userId, notificationId: notification.id },
      "Created notification"
    );

    res.status(201).json({
      message: "Notification created",
      notification,
    });
  } catch (err) {
    log.error(
      { error: err, userId },
      "Error creating notification"
    );
    res.status(500).json({
      error: "Error creating notification",
      message: err.message,
    });
  }
};
