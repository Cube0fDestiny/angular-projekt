import * as db from "../db/index.js";
import { publishEvent } from "../utils/rabbitmq-client.js";

const normalizeImagesPayload = (images) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image, idx) => {
      if (!image) return null;
      if (typeof image === "string") return { image_id: image, image_order: idx };

      const imageId = image.image_id || image.id;
      if (!imageId) return null;

      const order = Number.isInteger(image.image_order) ? image.image_order : idx;
      return { image_id: imageId, image_order: order };
    })
    .filter(Boolean);
};

const attachImages = async (client, messageId, images, log) => {
  if (!images.length) return [];

  const inserted = [];
  for (const { image_id, image_order } of images) {
    await client.query(
      `INSERT INTO "Chat_Message_Images" (message_id, image_id, image_order)
       VALUES ($1, $2, $3)`,
      [messageId, image_id, image_order],
    );
    inserted.push({ image_id, image_order });
  }

  log?.info({ count: inserted.length, messageId }, "Powiązano obrazy z wiadomością");
  return inserted;
};

export const getUserChats = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;
  const client = await db.pool.connect(); // Add this line
  try {
    const result = await client.query(
      `SELECT c.id, c.name, c.creator_id, c.created_at
            FROM "Chats" AS c
            JOIN "Chat_Participants" as cp on c.id = cp.chat_id
            WHERE cp.user_id = $1
            ORDER BY c.created_at DESC`,
      [userId]
    );

    log.info(
      { userId, chatCount: result.rowCount },
      "Pobrano czaty użytkownika."
    );
    res.status(200).json(result.rows);
  } catch (err) {
    log.error({ err, userId }, "Błąd serwera podczas pobierania czatów.");
    res
      .status(500)
      .json({ error: err.message + " Błąd serwera podczas pobierania czatów" });
  } finally {
    client.release(); // Don't forget to release!
  }
};

export const createChat = async (req, res) => {
  const { name, participantIds } = req.body;
  const creatorId = req.user.id;
  const log = req.log;

  if (!participantIds || !Array.isArray(participantIds)) {
    log.warn(
      { creatorId, body: req.body },
      "Nieudana próba stworzenia czatu z nieprawidłowymi danymi."
    );
    return res
      .status(400)
      .json({ error: "Podano nieprawidłowe dane użytkowników" });
  }

  const allParticipantIds = [creatorId, ...participantIds];
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const chatResult = await client.query(
      `INSERT INTO "Chats" (name, creator_id) VALUES ($1, $2) RETURNING *`,
      [name, creatorId]
    );
    const newChat = chatResult.rows[0];

    const participantQuery = `INSERT INTO "Chat_Participants" (chat_id, user_id) 
        VALUES ${allParticipantIds
          .map((_, i) => `($1, $${i + 2})`)
          .join(", ")}`;
    const participantValues = [newChat.id, ...allParticipantIds];
    await client.query(participantQuery, participantValues);

    await client.query("COMMIT");
    log.info(
      { chatId: newChat.id, creatorId, participants: allParticipantIds },
      "Utworzono nowy czat."
    );
    publishEvent("chat.created", {
      chatId: newChat.id,
      name: name,
      creatorId: creatorId,
      participants: allParticipantIds,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json(newChat);
    res.status(201).json(newChat);
  } catch (err) {
    await client.query("ROLLBACK");
    log.error({ err, creatorId }, "Błąd transakcji podczas tworzenia czatu.");
    res
      .status(500)
      .json({ error: err.message + " Błąd serwera podczas tworzenia czatu" });
  } finally {
    client.release();
  }
};

export const getChatMessages = async (req, res) => {
  const chatId = req.params.chatId;
  const log = req.log;

  try {
    const result = await db.query(
      `SELECT 
        m.id, 
        m.chat_id, 
        m.creator_id, 
        m.text, 
        m.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('image_id', mi.image_id, 'image_order', mi.image_order)
              ORDER BY mi.image_order
            )
            FROM "Chat_Message_Images" mi
            WHERE mi.message_id = m.id
          ),
          '[]'::json
        ) as images
      FROM "Chat_Messages" m
      WHERE m.chat_id = $1 AND m.deleted = false
      ORDER BY m.created_at DESC`,
      [chatId]
    );

    log.info(
      { chatId, messageCount: result.rowCount },
      "Pobrano wiadomości z czatu."
    );
    res.status(200).json(result.rows);
  } catch (err) {
    log.error(
      { err, chatId },
      "Błąd serwera podczas pobierania wiadomości czatu."
    );
    res.status(500).json({
      error:
        err.message +
        " Błąd serwera podczas pobierania wiadomości czatu o id: " +
        chatId,
    });
  }
};

export const createMessage = async (req, res) => {
  const { chatId } = req.params;
  const log = req.log;
  const { text, images } = req.body;
  const creatorId = req.user.id;

  const imagesPayload = normalizeImagesPayload(images);
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO "Chat_Messages" (chat_id, creator_id, text) VALUES ($1, $2, $3) RETURNING id, chat_id, creator_id, text, created_at`,
      [chatId, creatorId, text]
    );
    const newMessage = result.rows[0];

    const insertedImages = await attachImages(
      client,
      newMessage.id,
      imagesPayload,
      log,
    );

    await client.query("COMMIT");

    const messageWithImages = { ...newMessage, images: insertedImages };
    const io = req.app.get("io");
    io.to(chatId).emit("newMessage", messageWithImages);

    log.info(
      { messageId: newMessage.id, chatId, creatorId },
      "Stworzono i rozgłoszono nową wiadomość."
    );
    publishEvent("message.created", {
      messageId: newMessage.id,
      chatId: chatId,
      creatorId: creatorId,
      text: text,
      images: insertedImages,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json(messageWithImages);
  } catch (err) {
    await client.query("ROLLBACK");
    log.error(
      { err, chatId, creatorId },
      "Błąd serwera podczas tworzenia wiadomości."
    );
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia wiadomości",
    });
  } finally {
    client.release();
  }
};
