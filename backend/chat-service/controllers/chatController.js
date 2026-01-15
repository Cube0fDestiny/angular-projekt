import * as db from "../db/index.js";

export const getUserChats = async (req, res) => {
  const userId = req.user.id;
  const log = req.log;

  try {
    const result = await db.query(
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

  try {
    const result = await db.query(
      `SELECT id, chat_id, creator_id, text, created_at
      FROM "Chat_Messages"
      WHERE chat_id = $1 AND deleted = false
      ORDER BY created_at DESC`,
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
  const { text } = req.body;
  const creatorId = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO "Chat_Messages" (chat_id, creator_id, text) VALUES ($1, $2, $3) RETURNING *`,
      [chatId, creatorId, text]
    );
    const newMessage = result.rows[0];
    const io = req.app.get("io");

    io.to(chatId).emit("newMessage", newMessage);

    log.info(
      { messageId: newMessage.id, chatId, creatorId },
      "Stworzono i rozgłoszono nową wiadomość."
    );
    res.status(201).json(newMessage);
  } catch (err) {
    log.error(
      { err, chatId, creatorId },
      "Błąd serwera podczas tworzenia wiadomości."
    );
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia wiadomości",
    });
  }
};
