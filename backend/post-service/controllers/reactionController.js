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

    // Fetch post owner and reactor data for enriched notification
    const postData = await db.query(
      `SELECT creator_id FROM "Posts" WHERE id = $1`,
      [id]
    );
    
    const reactorData = await db.query(
      `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
      [user_id]
    );

    const eventPayload = {
      postId: id,
      userId: user_id,
      reactionType: 'orang',
    };

    // Add post owner for notification targeting
    if (postData.rows.length > 0) {
      eventPayload.postOwnerId = postData.rows[0].creator_id;
    }

    // Add reactor details for notification display
    if (reactorData.rows.length > 0) {
      const reactor = reactorData.rows[0];
      eventPayload.reactorName = reactor.name;
      eventPayload.reactorSurname = reactor.surname;
      eventPayload.reactorProfilePicture = reactor.profile_picture_id;
    }

    eventPayload.type = "post.liked";
    publishEvent("reaction.created", eventPayload);

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
