import * as db from "../db/index.js";
import WebSocket from "ws";

export const getUserChats = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query(
      `SELECT c.id, c.name, c.creator_id, c.created_at
            FROM "Chats" AS c
            JOIN "Chat_Participants" as cp on c.id = cp.chat_id
            WHERE cp.user_id = $1
            ORDER BY c.created_at DESC`,
      [userId]
    );

    console.log(`[Chat-Service] Pobrano czaty użytkownika o id: ${userId}`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: err.message + " Błąd serwera podczas pobierania czatów" });
  }
};

export const createChat = async (req, res) => {
  const { name, participantIds } = req.body;
  const creatorId = req.user.id;

  if (!participantIds || !Array.isArray(participantIds)) {
    return res
      .status(400)
      .json({ error: "Podano nieprawidłowe dane użytkowników" });
  }

  const allParticipantsIds = [creatorId, ...participantIds];
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
    const participantValues = [newChat.id, ...allParticipantsIds];
    await client.query(participantQuery, participantValues);

    await client.query("COMMIT");
    console.log(`[Chat-Service] Utworzono nowy czat o id: ${newChat.id}`);
    res.status(201).json(newChat);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res
      .status(500)
      .json({ error: err.message + " Błąd serwera podczas tworzenia czatu" });
  } finally {
    client.release();
  }
};

export const getChatMessages = async (req, res) => {
  const chatId = req.params.id;

  try {
    const result = await db.query(
      `SELECT id, chat_id, creator_id, text, created_at
      FROM "Chat_Messages"
      WHERE chat_id = $1 AND deleted = false
      ORDER BY created_at DESC`,
      [chatId]
    );

    console.log(`[Chat-Service] Pobrano wiadomości czatu o id: ${chatId}`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
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
  const { text } = req.body;
  const creatorId = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO "Chat_Messages" (chat_id, creator_id, text) VALUES ($1, $2, $3) RETURNING *`,
      [chatId, creatorId, text]
    );
    const newMessage = result.rows[0];
    const clients = req.app.get("clients");

    const participantsResult = await db.query(
      `SELECT user_id FROM "Chat_Participants" WHERE chat_id = $1 and user_id != $2`,
      [chatId, creatorId]
    );

    recipientIds = participantsResult.rows.map((participant) => {
      return participant.user_id;
    });

    recipientIds.forEach((recipientId) => {
      const recipientSocket = clients.get(recipientId);
      if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
        console.log(
          `[Chat-Service] Wysyłam wiadomość o id: ${newMessage.id} do użytkownika o id: ${recipientId}`
        );
        recipientSocket.send(JSON.stringify(newMessage));
      }
    });

    console.log(
      `[Chat-Service] Stworzono wiadomość o id: ${result.rows[0].id}`
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia wiadomości",
    });
  }
};
