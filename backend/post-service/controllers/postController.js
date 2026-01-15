import * as db from "../db/index.js";

export const getAllPosts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, creator_id, "Text", location_id, location_type, created_at
      FROM "Posts"
      WHERE deleted = false
      ORDER BY created_at DESC`
    );

    console.log(
      `[Post-Service] Pobrano ${result.rows.length} postów z bazy danych`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania postów",
    });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, creator_id, "Text", location_id, location_type, created_at
      FROM "Posts"
      WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono posta o id: " + id });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania posta o id: " + id,
    });
  }
};

export const createPost = async (req, res) => {
  const { content, location_id, location_type } = req.body;
  const creator_id = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO "Posts" (creator_id, "Text", location_id, location_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, created_at, "Text", location_id, location_type, creator_id`,
      [creator_id, content, location_id || null, location_type || null]
    );

    console.log(`[Post-Service] Stworzono post o id: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia posta",
    });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const resulty = await db.query(
      `UPDATE "Posts"
      SET "Text" = $1
      WHERE id = $2 AND deleted = false
      RETURNING *`,
      [content, id]
    );

    console.log(`[Post-Service] Zaktualizowano post o id: ${id}`);
    res.status(200).json(resulty.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas aktualizacji posta o id: " + id,
    });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const isDeleted = await db.query(
      `SELECT deleted FROM "Posts" WHERE id = $1`,
      [id]
    );

    if (isDeleted.rows.length !== 0 && isDeleted.rows[0].deleted) {
      return res.status(404).json({ message: "Post został już usunięty" });
    }

    await db.query(
      `UPDATE "Posts"
      SET deleted = true
      WHERE id = $1 AND deleted = false`,
      [id]
    );

    console.log(`[Post-Service] Usunięto post o id: ${id}`);
    res.status(200).json({ message: "Post został usunięty" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas usuwania posta o id: " + id,
    });
  }
};