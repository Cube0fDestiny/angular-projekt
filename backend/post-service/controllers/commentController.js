import { publishEvent } from "../utils/rabbitmq-client.js";
import * as db from "../db/index.js";

// Comment endpoints
export const getCommentsForPosts = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await db.query(
      `SELECT id, created_at, in_reply_to, text, image_ids, creator_id, post_id
      FROM "Post_Comments"
      WHERE post_id = $1 AND deleted = false
      ORDER BY created_at DESC`,
      [postId]
    );

    req.log.info(`[Post-Service] Pobrano komentarze do posta o id: ${postId}`);
    res.status(200).json(result.rows);
  } catch (err) {
    req.error(err);
    res.status(500).json({
      error:
        err.message +
        " Błąd serwera podczas pobierania komentarzy do posta o id: " +
        postId,
    });
  }
};

export const createComment = async (req, res) => {
  const { postId } = req.params;
  const { text, in_reply_to, image_ids } = req.body;
  const creator_id = req.user.id;

  req.log.info(`[Post-Service] Tworzenie komentarza do posta o id: ${postId}`);
  try {
    const result = await db.query(
      `INSERT INTO "Post_Comments" (text, in_reply_to, image_ids, creator_id, post_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [text, in_reply_to || null, image_ids || [], creator_id, postId]
    );
    const newComment = result.rows[0];
    
    // Fetch post owner and commenter data for enriched notification
    const postData = await db.query(
      `SELECT creator_id FROM "Posts" WHERE id = $1`,
      [postId]
    );
    
    const commenterData = await db.query(
      `SELECT user_id, name, surname, profile_picture_id FROM "Users" WHERE user_id = $1`,
      [creator_id]
    );

    const eventPayload = {
      commentId: newComment.id,
      postId: newComment.post_id,
      creatorId: newComment.creator_id,
      commentText: text ? text.substring(0, 100) : '',
    };

    // Add post owner for notification targeting
    if (postData.rows.length > 0) {
      eventPayload.postOwnerId = postData.rows[0].creator_id;
    }

    // Add commenter details for notification display
    if (commenterData.rows.length > 0) {
      const commenter = commenterData.rows[0];
      eventPayload.commenterName = commenter.name;
      eventPayload.commenterSurname = commenter.surname;
      eventPayload.commenterProfilePicture = commenter.profile_picture_id;
    }

    eventPayload.type = "post.commented";
    publishEvent("comment.created", eventPayload);

    req.log.info(
      `[Post-Service] Utworzono komentarz o id: ${newComment.id}`
    );
    res.status(201).json(newComment);
  } catch (err) {
    req.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia komentarza",
    });
  }
};

export const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;

  try {
    const result = await db.query(
      `UPDATE "Post_Comments"
      SET text = $1
      WHERE id = $2 AND deleted = false
      RETURNING *`,
      [text, commentId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono komentarza o id: " + commentId });
    }

    req.log.info(`[Post-Service] Zaktualizowano komentarz o id: ${commentId}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    req.error(err);
    res.status(500).json({
      error:
        err.message +
        " Błąd serwera podczas aktualizacji komentarza o id: " +
        commentId,
    });
  }
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const result = await db.query(
      `UPDATE "Post_Comments"
      SET deleted = true
      WHERE id = $1 AND deleted = false
      RETURNING id`,
      [commentId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({
          message:
            "Komentarz nie istnieje lub został już usunięty - id: " + commentId,
        });
    }

    req.log.info(`[Post-Service] Usunięto komentarz o id: ${commentId}`);
    res.status(200).json({ message: "Komentarz został usunięty" });
  } catch (err) {
    req.error(err);
    res.status(500).json({
      error:
        err.message +
        " Błąd serwera podczas usuwania komentarza o id: " +
        commentId,
    });
  }
};
