import * as db from "../db/index.js";

export const getAllPosts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
          p.id,
          p.creator_id,
          p."Text",
          p.location_id,
          p.location_type,
          p.created_at,
          -- Aggregate reactions into a JSON object directly in the query
          COALESCE(
              (
                  SELECT json_build_object(
                      'totalCount', COUNT(*),
                      'counts', json_agg(json_build_object('type', pr.reaction_type, 'count', pr.count))
                  )
                  FROM (
                      SELECT reaction_type, COUNT(*) as count
                      FROM "Post_Reactions"
                      WHERE post_id = p.id
                      GROUP BY reaction_type
                  ) pr
              ),
              '{"totalCount": 0, "counts": []}'::json
          ) as reactions
          FROM
              "Posts" AS p
          WHERE
              p.deleted = false
          ORDER BY
              p.created_at DESC;`
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
    const postResult = await db.query(
      `SELECT id, creator_id, "Text", location_id, location_type, created_at
      FROM "Posts"
      WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono posta o id: " + id });
    }

    const post = postResult.rows[0];

    const reactionsResult = await db.query(
      `SELECT reaction_type, COUNT(*) as count
      FROM "Post_Reactions"
      WHERE post_id = $1
      GROUP BY reaction_type`,
      [id]
    );

    let totalCount = 0;
    const reactionCounts = reactionsResult.rows.map((row) => {
      const count = parseInt(row.count);
      totalCount += count;
      return { type: row.reaction_type, count: count };
    });

    post.reactions = {
      totalCount: totalCount,
      counts: reactionCounts,
    };

    console.log(`[Post-Service] Pobrano post o id: ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania posta o id: " + id,
    });
  }
};

export const getPostsByUserId = async (req, res) => {
  const userId = req.user.id;
  console.log(userId);

  try {
    const result = await db.query(
      `
      SELECT
          p.id,
          p.creator_id,
          p."Text",
          p.location_id,
          p.location_type,
          p.created_at,
          -- This is the same aggregation logic as in getAllPosts
          COALESCE(
              (
                  SELECT json_build_object(
                      'totalCount', COUNT(*),
                      'counts', json_agg(json_build_object('type', pr.reaction_type, 'count', pr.count))
                  )
                  FROM (
                      SELECT reaction_type, COUNT(*) as count
                      FROM "Post_Reactions"
                      WHERE post_id = p.id
                      GROUP BY reaction_type
                  ) pr
              ),
              '{"totalCount": 0, "counts": []}'::json
          ) as reactions
      FROM
          "Posts" AS p
      WHERE
          p.creator_id = $1 AND p.deleted = false -- The only major difference is this line
      ORDER BY
          p.created_at DESC;
      `,
      [userId]
    );

    console.log(`[Post-Service] Pobrano posty użytkownika o id: ${userId}`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas pobierania postów użytkownika",
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
      RETURNING id, created_at, "Text", location_id, location_type, creator_id`,
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
