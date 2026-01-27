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
            "reaction.created",
            "comment.created",
            "user.friendRequested",
            "user.friendAccepted",
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
                        
                        // Fetch requester's data to include in notification
                        try {
                            const requesterData = await db.query(
                                `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                [content.requesterId]
                            );
                            
                            if (requesterData.rows.length > 0) {
                                const requester = requesterData.rows[0];
                                notificationTitle = "Zaproszenie do znajomych";
                                notificationMessage = `${requester.name} ${requester.surname} zaprasza Cię do znajomych`;
                                notificationData = {
                                    requesterId: content.requesterId,
                                    requesterName: requester.name,
                                    requesterSurname: requester.surname,
                                    requesterProfilePicture: requester.profile_picture_id
                                };
                            } else {
                                // Fallback if user not found
                                notificationTitle = "Zaproszenie do znajomych";
                                notificationMessage = "Otrzymałeś nowe zaproszenie do znajomych";
                                notificationData = { requesterId: content.requesterId };
                            }
                        } catch (dbErr) {
                            logger.error({ error: dbErr }, "Error fetching requester data");
                            // Fallback to basic notification
                            notificationTitle = "Zaproszenie do znajomych";
                            notificationMessage = "Otrzymałeś nowe zaproszenie do znajomych";
                            notificationData = { requesterId: content.requesterId };
                        }
                    } else if (msg.fields.routingKey === "user.friendAccepted" && content.friendId) {
                        // Friend request accepted - notify the original requester
                        targetUserId = content.friendId; // Notify the person who sent the original request
                        notificationType = "friend.accepted";
                        
                        // Fetch accepter's data to include in notification
                        try {
                            const accepterData = await db.query(
                                `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                [content.userId]
                            );
                            
                            if (accepterData.rows.length > 0) {
                                const accepter = accepterData.rows[0];
                                notificationTitle = "Zaproszenie zaakceptowane";
                                notificationMessage = `${accepter.name} ${accepter.surname} zaakceptował(a) Twoje zaproszenie do znajomych`;
                                notificationData = {
                                    userId: content.userId,
                                    accepterName: accepter.name,
                                    accepterSurname: accepter.surname,
                                    accepterProfilePicture: accepter.profile_picture_id
                                };
                            } else {
                                // Fallback if user not found
                                notificationTitle = "Zaproszenie zaakceptowane";
                                notificationMessage = "Twoje zaproszenie do znajomych zostało zaakceptowane";
                                notificationData = { userId: content.userId };
                            }
                        } catch (dbErr) {
                            logger.error({ error: dbErr }, "Error fetching accepter data");
                            notificationTitle = "Zaproszenie zaakceptowane";
                            notificationMessage = "Twoje zaproszenie do znajomych zostało zaakceptowane";
                            notificationData = { userId: content.userId };
                        }
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
                        
                        // Fetch mentioner's data to include in notification
                        try {
                            const mentionerData = await db.query(
                                `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                [content.mentionerId || content.authorId]
                            );
                            
                            if (mentionerData.rows.length > 0) {
                                const mentioner = mentionerData.rows[0];
                                notificationTitle = "Zostałeś wspomniany";
                                notificationMessage = `${mentioner.name} ${mentioner.surname} wspomniał o Tobie`;
                                notificationData = {
                                    ...content,
                                    mentionerName: mentioner.name,
                                    mentionerSurname: mentioner.surname,
                                    mentionerProfilePicture: mentioner.profile_picture_id
                                };
                            } else {
                                notificationTitle = "Zostałeś wspomniany";
                                notificationMessage = "Użytkownik cię wspomniał";
                                notificationData = content;
                            }
                        } catch (dbErr) {
                            logger.error({ error: dbErr }, "Error fetching mentioner data");
                            notificationTitle = "Zostałeś wspomniany";
                            notificationMessage = "Użytkownik cię wspomniał";
                            notificationData = content;
                        }
                    } else if (msg.fields.routingKey === "reaction.created" && content.postOwnerId) {
                        // Post reaction (like) - notify the post owner
                        targetUserId = content.postOwnerId;
                        notificationType = "post.liked";
                        
                        // Use enriched data from event if available, otherwise fetch from DB
                        if (content.reactorName && content.reactorSurname) {
                            notificationTitle = "Twój post został polubiony";
                            notificationMessage = `${content.reactorName} ${content.reactorSurname} polubił Twój post`;
                            notificationData = {
                                postId: content.postId,
                                userId: content.userId,
                                reactorName: content.reactorName,
                                reactorSurname: content.reactorSurname,
                                reactorProfilePicture: content.reactorProfilePicture,
                                reactionType: content.reactionType
                            };
                        } else {
                            // Fallback: fetch reactor data from DB
                            try {
                                const reactorData = await db.query(
                                    `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                    [content.userId]
                                );
                                
                                if (reactorData.rows.length > 0) {
                                    const reactor = reactorData.rows[0];
                                    notificationTitle = "Twój post został polubiony";
                                    notificationMessage = `${reactor.name} ${reactor.surname} polubił Twój post`;
                                    notificationData = {
                                        postId: content.postId,
                                        userId: content.userId,
                                        reactorName: reactor.name,
                                        reactorSurname: reactor.surname,
                                        reactorProfilePicture: reactor.profile_picture_id,
                                        reactionType: content.reactionType
                                    };
                                } else {
                                    notificationTitle = "Twój post został polubiony";
                                    notificationMessage = "Komuś spodobał się twój post";
                                    notificationData = content;
                                }
                            } catch (dbErr) {
                                logger.error({ error: dbErr }, "Error fetching reactor data");
                                notificationTitle = "Twój post został polubiony";
                                notificationMessage = "Komuś spodobał się twój post";
                                notificationData = content;
                            }
                        }
                    } else if (msg.fields.routingKey === "comment.created" && content.postOwnerId) {
                        // Post comment - notify the post owner
                        targetUserId = content.postOwnerId;
                        notificationType = "post.commented";
                        
                        // Use enriched data from event if available, otherwise fetch from DB
                        if (content.commenterName && content.commenterSurname) {
                            notificationTitle = "Nowy komentarz";
                            notificationMessage = `${content.commenterName} ${content.commenterSurname} skomentował Twój post`;
                            notificationData = {
                                postId: content.postId,
                                commentId: content.commentId,
                                creatorId: content.creatorId,
                                commenterName: content.commenterName,
                                commenterSurname: content.commenterSurname,
                                commenterProfilePicture: content.commenterProfilePicture,
                                commentText: content.commentText
                            };
                        } else {
                            // Fallback: fetch commenter data from DB
                            try {
                                const commenterData = await db.query(
                                    `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                    [content.creatorId]
                                );
                                
                                if (commenterData.rows.length > 0) {
                                    const commenter = commenterData.rows[0];
                                    notificationTitle = "Nowy komentarz";
                                    notificationMessage = `${commenter.name} ${commenter.surname} skomentował Twój post`;
                                    notificationData = {
                                        postId: content.postId,
                                        commentId: content.commentId,
                                        creatorId: content.creatorId,
                                        commenterName: commenter.name,
                                        commenterSurname: commenter.surname,
                                        commenterProfilePicture: commenter.profile_picture_id,
                                        commentText: content.commentText
                                    };
                                } else {
                                    notificationTitle = "Nowy komentarz";
                                    notificationMessage = "Ktoś skomentował Twój post";
                                    notificationData = content;
                                }
                            } catch (dbErr) {
                                logger.error({ error: dbErr }, "Error fetching commenter data");
                                notificationTitle = "Nowy komentarz";
                                notificationMessage = "Ktoś skomentował Twój post";
                                notificationData = content;
                            }
                        }
                    } else if (content.likedUserId) {
                        // Post liked
                        targetUserId = content.likedUserId;
                        notificationType = "post.liked";
                        
                        // Fetch liker's data to include in notification
                        try {
                            const likerData = await db.query(
                                `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                [content.likerId || content.userId]
                            );
                            
                            if (likerData.rows.length > 0) {
                                const liker = likerData.rows[0];
                                notificationTitle = "Twój post został polubiony";
                                notificationMessage = `${liker.name} ${liker.surname} polubił Twój post`;
                                notificationData = {
                                    ...content,
                                    likerName: liker.name,
                                    likerSurname: liker.surname,
                                    likerProfilePicture: liker.profile_picture_id
                                };
                            } else {
                                notificationTitle = "Twój post został polubiony";
                                notificationMessage = "Komuś spodobał się twój post";
                                notificationData = content;
                            }
                        } catch (dbErr) {
                            logger.error({ error: dbErr }, "Error fetching liker data");
                            notificationTitle = "Twój post został polubiony";
                            notificationMessage = "Komuś spodobał się twój post";
                            notificationData = content;
                        }
                    } else if (content.invitedUserId) {
                        // Group invite
                        targetUserId = content.invitedUserId;
                        notificationType = "group.invited";
                        
                        // Fetch group data to include in notification
                        try {
                            const groupData = await db.query(
                                `SELECT id, name, profile_picture_id FROM "Groups" WHERE id = $1`,
                                [content.groupId]
                            );
                            
                            if (groupData.rows.length > 0) {
                                const group = groupData.rows[0];
                                notificationTitle = "Zaproszenie do grupy";
                                notificationMessage = `Zostałeś zaproszony do grupy "${group.name}"`;
                                notificationData = {
                                    groupId: content.groupId,
                                    groupName: group.name,
                                    groupProfilePicture: group.profile_picture_id,
                                    inviterId: content.inviterId
                                };
                            } else {
                                // Fallback if group not found
                                notificationTitle = "Zaproszenie do grupy";
                                notificationMessage = "Zostałeś zaproszony do grupy";
                                notificationData = content;
                            }
                        } catch (dbErr) {
                            logger.error({ error: dbErr }, "Error fetching group data");
                            notificationTitle = "Zaproszenie do grupy";
                            notificationMessage = "Zostałeś zaproszony do grupy";
                            notificationData = content;
                        }
                    } else if (msg.fields.routingKey === "group.memberAccepted" && content.userId) {
                        // Group membership accepted - notify the accepted user
                        targetUserId = content.userId;
                        notificationType = "group.memberAccepted";
                        
                        // Fetch group data to include in notification
                        try {
                            const groupData = await db.query(
                                `SELECT id, name, profile_picture_id FROM "Groups" WHERE id = $1`,
                                [content.groupId]
                            );
                            
                            if (groupData.rows.length > 0) {
                                const group = groupData.rows[0];
                                notificationTitle = "Zostałeś zaakceptowany do grupy";
                                notificationMessage = `Twoja prośba o dołączenie do grupy "${group.name}" została zaakceptowana`;
                                notificationData = {
                                    groupId: content.groupId,
                                    groupName: group.name,
                                    groupProfilePicture: group.profile_picture_id,
                                    acceptedBy: content.acceptedBy
                                };
                            } else {
                                // Fallback if group not found
                                notificationTitle = "Zostałeś zaakceptowany do grupy";
                                notificationMessage = "Twoja prośba o dołączenie do grupy została zaakceptowana";
                                notificationData = content;
                            }
                        } catch (dbErr) {
                            logger.error({ error: dbErr }, "Error fetching group data for memberAccepted");
                            notificationTitle = "Zostałeś zaakceptowany do grupy";
                            notificationMessage = "Twoja prośba o dołączenie do grupy została zaakceptowana";
                            notificationData = content;
                        }
                    } else if (content.chatId && content.participants && msg.fields.routingKey === "chat.created") {
                        // Chat created - notify all participants except creator
                        const participants = content.participants.filter(id => id !== content.creatorId);
                        
                        // Use enriched data from event if available, otherwise fetch from DB
                        let creatorData = null;
                        if (content.creatorName && content.creatorSurname) {
                            // Use data from event
                            creatorData = {
                                name: content.creatorName,
                                surname: content.creatorSurname,
                                profile_picture_id: content.creatorProfilePicture
                            };
                        } else {
                            // Fallback: fetch from DB
                            try {
                                const creatorResult = await db.query(
                                    `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                    [content.creatorId]
                                );
                                if (creatorResult.rows.length > 0) {
                                    creatorData = creatorResult.rows[0];
                                }
                            } catch (dbErr) {
                                logger.error({ error: dbErr }, "Error fetching creator data for chat");
                            }
                        }
                        
                        for (const participantId of participants) {
                            const notificationData = {
                                chatId: content.chatId,
                                creatorId: content.creatorId,
                                chatName: content.name
                            };
                            
                            if (creatorData) {
                                notificationData.creatorName = creatorData.name;
                                notificationData.creatorSurname = creatorData.surname;
                                notificationData.creatorProfilePicture = creatorData.profile_picture_id;
                            }
                            
                            const chatTitle = creatorData 
                                ? `${creatorData.name} ${creatorData.surname} dodał Cię do czatu`
                                : "Dodano Cię do czatu";
                            const chatMessage = content.name 
                                ? `Zostałeś dodany do czatu "${content.name}"` 
                                : "Zostałeś dodany do nowego czatu";
                            
                            const chatNotification = await db.query(
                                `INSERT INTO "Notifications" (user_id, type, title, message, data, is_read, created_at)
                                 VALUES ($1, $2, $3, $4, $5, false, NOW())
                                 RETURNING *`,
                                [
                                    participantId,
                                    "chat.created",
                                    chatTitle,
                                    chatMessage,
                                    JSON.stringify(notificationData),
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
                        // Use enriched data from event if available, otherwise fetch from DB
                        let senderData = null;
                        if (content.senderName && content.senderSurname) {
                            // Use data from event
                            senderData = {
                                name: content.senderName,
                                surname: content.senderSurname,
                                profile_picture_id: content.senderProfilePicture
                            };
                        } else {
                            // Fallback: fetch from DB
                            try {
                                const senderResult = await db.query(
                                    `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
                                    [content.creatorId || content.senderId]
                                );
                                if (senderResult.rows.length > 0) {
                                    senderData = senderResult.rows[0];
                                }
                            } catch (dbErr) {
                                logger.error({ error: dbErr }, "Error fetching sender data for message");
                            }
                        }
                        
                        // Fetch all participants of the chat
                        const participantsResult = await db.query(
                            `SELECT user_id FROM "Chat_Participants" WHERE chat_id = $1 AND user_id != $2`,
                            [content.chatId, content.creatorId || content.senderId]
                        );
                        
                        for (const row of participantsResult.rows) {
                            const participantId = row.user_id;
                            
                            const notificationData = {
                                chatId: content.chatId,
                                messageId: content.messageId,
                                creatorId: content.creatorId || content.senderId
                            };
                            
                            if (senderData) {
                                notificationData.senderName = senderData.name;
                                notificationData.senderSurname = senderData.surname;
                                notificationData.senderProfilePicture = senderData.profile_picture_id;
                            }
                            
                            const msgTitle = senderData 
                                ? `${senderData.name} ${senderData.surname}` 
                                : "Nowa wiadomość";
                            const msgText = content.text ? content.text.substring(0, 100) : "Otrzymałeś nową wiadomość";
                            
                            const msgNotification = await db.query(
                                `INSERT INTO "Notifications" (user_id, type, title, message, data, is_read, created_at)
                                 VALUES ($1, $2, $3, $4, $5, false, NOW())
                                 RETURNING *`,
                                [
                                    participantId,
                                    "message.created",
                                    msgTitle,
                                    msgText,
                                    JSON.stringify(notificationData),
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
