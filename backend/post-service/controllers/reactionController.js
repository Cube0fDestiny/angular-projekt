import { publishEvent } from "../utils/rabbitmq-client.js";
import * as db from "../db/index.js";

export const toggleReaction = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const existing = await db.query(
      `SELECT * FROM "Post_Reactions" WHERE post_id = $1 AND user_id = $2`,
      [id, user_id],
    );

    if (existing.rows.length > 0) {
      await db.query(
        `DELETE FROM "Post_Reactions" WHERE post_id = $1 AND user_id = $2`,
        [id, user_id],
      );
      req.log.info(
        `[Post-Service] Usunięto reakcje o id: ${existing.rows[0].id}`,
      );
      return res.status(200).json({ message: "Reakcja została usunięta", liked: false });
    }

    await db.query(
      `INSERT INTO "Post_Reactions" (post_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
      [id, user_id, 'orang'],
    );

    publishEvent("reaction.created", {
      postId: id,
      userId: user_id,
      reactionType: 'orang',
    });

    req.log.info(`[Post-Service] Stworzono reakcje o id: ${id}`);
    res.status(201).json({ message: "Reakcja została stworzona", liked: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia reakcji",
    });
  }
};

export const getMyReactionForPost = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  if (!id) {
    return res.status(400).json({ error: "Post ID jest wymagany" });
  }

  try {
    const result = await db.query(
      `SELECT reaction_type
        FROM "Post_Reactions"
        WHERE post_id = $1 AND user_id = $2`,
      [id, user_id],
    );

    const liked = result.rowCount > 0;
    req.log.info(`[Post-Service] Pobrano reakcje o id: ${id}`);
    return res.status(200).json({ liked });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania reakcji",
    });
  }
};
