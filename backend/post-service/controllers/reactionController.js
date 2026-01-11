import * as db from "../db/index.js";

export const toggleReaction = async (req, res) => {
  const { id } = req.params;
  const { reaction } = req.body;
  const user_id = req.user.id;

  try {
    const existing = await db.query(
      `SELECT * FROM "Post_Reactions" WHERE post_id = $1 AND user_id = $2`,
      [id, user_id]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].reaction_type === reaction) {
        await db.query(
          `DELETE FROM "Post_Reactions" WHERE post_id = $1 AND user_id = $2`,
          [id, user_id]
        );
        console.log(
          `[Post-Service] Usunięto reakcje o id: ${existing.rows[0].id}`
        );
        return res.status(200).json({ message: "Reakcja została usunięta" });
      } else {
        await db.query(
          `UPDATE "Post_Reactions" SET reaction_type = $1 WHERE post_id = $2 AND user_id = $3`,
          [reaction, id, user_id]
        );
      }
      return res
        .status(200)
        .json({ message: "Reakcja została zaktualizowana" });
    }

    await db.query(
      `INSERT INTO "Post_Reactions" (post_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
      [id, user_id, reaction]
    );

    console.log(`[Post-Service] Stworzono reakcje o id: ${id}`);
    res.status(201).json({ message: "Reakcja została stworzona" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia reakcji",
    });
  }
};