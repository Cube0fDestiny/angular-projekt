import amqp from "amqplib";
import { logger, connectedUsers } from "../server.js";
import * as db from "../db/index.js";

let channel = null;
const exchange = "app_events";
const notificationQueue = "notifications";

export const connectRabbitMQ = async () => {
    if (channel) {
        logger.info("RabbitMQ already connected");
        return;
    }
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(exchange, "topic", { durable: true });
        logger.info("RabbitMQ connected");
    } catch (err) {
        logger.error({ error: err }, "RabbitMQ connection failed");
        process.exit(1);
    }
};

export const publishEvent = (routingKey, data) => {
    if (!channel) {
        logger.info("RabbitMQ not connected");
        return;
    }
    const message = Buffer.from(JSON.stringify(data));
    channel.publish(exchange, routingKey, message, { persistent: true });
    logger.info({ routingKey }, "Event published");
};

/**
 * Consume notifications from RabbitMQ and broadcast to connected users via Socket.IO
 */
export const consumeNotifications = async (io) => {
    if (!channel) {
        logger.error("RabbitMQ channel not initialized");
        return;
    }

    try {
        // Assert queue with specific name for notifications
        await channel.assertQueue(notificationQueue, { durable: true });

        // Bind queue to specific routing keys for notifications
        const routingKeys = [
            "notification.created",
            "notification.*",
            "user.mentioned",
            "post.liked",
            "post.commented",
            "user.friendRequested",
            "group.invited",
            "group.memberAccepted",
            "group.created",
            "message.created",
            "chat.created",
        ];

        for (const key of routingKeys) {
            await channel.bindQueue(notificationQueue, exchange, key);
            logger.info({ routingKey: key }, "Queue bound to routing key");
        }

        logger.info("Notification consumer started");

        // Consume messages from the queue
        await channel.consume(notificationQueue, async (msg) => {
            if (msg) {
                logger.info({ msg: msg.content.toString() }, "Message received from RabbitMQ");
                try {
                    const content = JSON.parse(msg.content.toString());
                    logger.info(
                        { content },
                        "Received notification from RabbitMQ"
                    );

                    // Determine the target user and notification details based on event type
                    let targetUserId, notificationType, notificationTitle, notificationMessage, notificationData;

                    if (content.requesteeId) {
                        // Friend request: notify the requestee
                        targetUserId = content.requesteeId;
                        notificationType = "friend.request";
                        notificationTitle = "Zaproszenie do znajomych";
                        notificationMessage = "Otrzymałeś nowe zaproszenie do znajomych";
                        notificationData = { requesterId: content.requesterId };
                    } else if (content.userId) {
                        // Generic notification with userId
                        targetUserId = content.userId;
                        notificationType = content.type || "general";
                        notificationTitle = content.title || "Nowe powiadomienie";
                        notificationMessage = content.message || "";
                        notificationData = content.data || {};
                    } else if (content.mentionedUserId) {
                        // User mentioned
                        targetUserId = content.mentionedUserId;
                        notificationType = "user.mentioned";
                        notificationTitle = "Zostałeś wspomniany";
                        notificationMessage = "Użytkownik cię wspomniał";
                        notificationData = content;
                    } else if (content.likedUserId) {
                        // Post liked
                        targetUserId = content.likedUserId;
                        notificationType = "post.liked";
                        notificationTitle = "Twój post został polubiony";
                        notificationMessage = "Komuś spodobał się twój post";
                        notificationData = content;
                    } else if (content.invitedUserId) {
                        // Group invite
                        targetUserId = content.invitedUserId;
                        notificationType = "group.invited";
                        notificationTitle = "Zaproszenie do grupy";
                        notificationMessage = "Zostałeś zaproszony do grupy";
                        notificationData = content;
                    } else if (content.chatId && content.participants && msg.fields.routingKey === "chat.created") {
                        // Chat created - notify all participants except creator
                        const participants = content.participants.filter(id => id !== content.creatorId);
                        
                        for (const participantId of participants) {
                            const chatNotification = await db.query(
                                `INSERT INTO "Notifications" (user_id, type, title, message, data, is_read, created_at)
                                 VALUES ($1, $2, $3, $4, $5, false, NOW())
                                 RETURNING *`,
                                [
                                    participantId,
                                    "chat.created",
                                    "Dodano Cię do czatu",
                                    content.name ? `Zostałeś dodany do czatu "${content.name}"` : "Zostałeś dodany do nowego czatu",
                                    JSON.stringify({ chatId: content.chatId, creatorId: content.creatorId }),
                                ]
                            );
                            
                            const notification = chatNotification.rows[0];
                            const userSocket = connectedUsers.get(participantId);
                            if (userSocket) {
                                userSocket.emit("newNotification", {
                                    id: notification.id,
                                    type: notification.type,
                                    title: notification.title,
                                    message: notification.message,
                                    data: notification.data,
                                    isRead: notification.is_read,
                                    createdAt: notification.created_at,
                                });
                            }
                        }
                        
                        channel.ack(msg);
                        return;
                    } else if (content.messageId && content.chatId && msg.fields.routingKey === "message.created") {
                        // New message in chat - need to notify other participants
                        // First, fetch all participants of the chat
                        const participantsResult = await db.query(
                            `SELECT user_id FROM "Chat_Participants" WHERE chat_id = $1 AND user_id != $2`,
                            [content.chatId, content.creatorId]
                        );
                        
                        for (const row of participantsResult.rows) {
                            const participantId = row.user_id;
                            const msgNotification = await db.query(
                                `INSERT INTO "Notifications" (user_id, type, title, message, data, is_read, created_at)
                                 VALUES ($1, $2, $3, $4, $5, false, NOW())
                                 RETURNING *`,
                                [
                                    participantId,
                                    "message.created",
                                    "Nowa wiadomość",
                                    content.text ? content.text.substring(0, 100) : "Otrzymałeś nową wiadomość",
                                    JSON.stringify({ chatId: content.chatId, messageId: content.messageId, creatorId: content.creatorId }),
                                ]
                            );
                            
                            const notification = msgNotification.rows[0];
                            const userSocket = connectedUsers.get(participantId);
                            if (userSocket) {
                                userSocket.emit("newNotification", {
                                    id: notification.id,
                                    type: notification.type,
                                    title: notification.title,
                                    message: notification.message,
                                    data: notification.data,
                                    isRead: notification.is_read,
                                    createdAt: notification.created_at,
                                });
                            }
                        }
                        
                        channel.ack(msg);
                        return;
                    } else {
                        logger.warn({ content }, "Unknown notification type");
                        channel.ack(msg);
                        return;
                    }

                    // Save notification to database
                    const result = await db.query(
                        `INSERT INTO "Notifications" (user_id, type, title, message, data, is_read, created_at)
                         VALUES ($1, $2, $3, $4, $5, false, NOW())
                         RETURNING *`,
                        [
                            targetUserId,
                            notificationType,
                            notificationTitle,
                            notificationMessage,
                            JSON.stringify(notificationData),
                        ]
                    );

                    const notification = result.rows[0];

                    logger.info(
                        { notificationId: notification.id, userId: targetUserId },
                        "Notification saved to database"
                    );

                    // Send notification to user via Socket.IO if connected
                    const userSocket = connectedUsers.get(targetUserId);
                    if (userSocket) {
                        userSocket.emit("newNotification", {
                            id: notification.id,
                            type: notification.type,
                            title: notification.title,
                            message: notification.message,
                            data: notification.data,
                            isRead: notification.is_read,
                            createdAt: notification.created_at,
                        });
                        logger.info(
                            { userId: targetUserId },
                            "Notification emitted to user via Socket.IO"
                        );
                    } else {
                        logger.info(
                            { userId: targetUserId },
                            "User not connected, notification saved for later retrieval"
                        );
                    }

                    // Acknowledge message
                    channel.ack(msg);
                } catch (err) {
                    logger.error(
                        { error: err },
                        "Error processing notification from RabbitMQ"
                    );
                    // Negative acknowledge to re-queue the message
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (err) {
        logger.error({ error: err }, "Error setting up notification consumer");
        process.exit(1);
    }
};
