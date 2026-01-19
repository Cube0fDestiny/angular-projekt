import { publishEvent } from "../utils/rabbitmq-client.js";
import * as db from "../db/index.js";

const normalizeImagesPayload = (images) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image, idx) => {
      if (!image) return null;

      if (typeof image === "string") {
        return { image_id: image, image_order: idx };
      }

      const imageId = image.image_id || image.id;
      if (!imageId) return null;

      const order = Number.isInteger(image.image_order)
        ? image.image_order
        : idx;

      return { image_id: imageId, image_order: order };
    })
    .filter(Boolean);
};

const attachImages = async (client, postId, images, log) => {
  if (!images.length) return [];

  const inserted = [];
  for (const { image_id, image_order } of images) {
    await client.query(
      `INSERT INTO "Post_Images" (post_id, image_id, image_order)
       VALUES ($1, $2, $3)`,
      [postId, image_id, image_order],
    );
    inserted.push({ image_id, image_order });
  }

  log?.info(
    { count: inserted.length, postId },
    "Powiązano obrazy z postem",
  );
  return inserted;
};

export const getAllPosts = async (req, res) => {
  const log = req.log;
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
          ) as reactions,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object('image_id', pi.image_id, 'image_order', pi.image_order)
                ORDER BY pi.image_order
              )
              FROM "Post_Images" pi
              WHERE pi.post_id = p.id
            ),
            '[]'::json
          ) as images
          FROM
              "Posts" AS p
          WHERE
              p.deleted = false
          ORDER BY
              p.created_at DESC;`,
    );

    log.info(
      `[Post-Service] Pobrano ${result.rows.length} postów z bazy danych`,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania postów",
    });
  }
};

export const getPostById = async (req, res) => {
  const log = req.log;
  const { id } = req.params;

  try {
    const postResult = await db.query(
      `SELECT p.id, p.creator_id, p."Text", p.location_id, p.location_type, p.created_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object('image_id', pi.image_id, 'image_order', pi.image_order)
            ORDER BY pi.image_order
          )
          FROM "Post_Images" pi
          WHERE pi.post_id = p.id
        ),
        '[]'::json
      ) as images
      FROM "Posts" p
      WHERE p.id = $1 AND p.deleted = false`,
      [id],
    );

    if (postResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono posta o id: " + id });
    }

    const postWithReactions = postResult.rows[0];

    const reactionsResult = await db.query(
      `SELECT reaction_type, COUNT(*) as count
      FROM "Post_Reactions"
      WHERE post_id = $1
      GROUP BY reaction_type`,
      [id],
    );

    let totalCount = 0;
    const reactionCounts = reactionsResult.rows.map((row) => {
      const count = parseInt(row.count);
      totalCount += count;
      return { type: row.reaction_type, count: count };
    });

    postWithReactions.reactions = {
      totalCount: totalCount,
      counts: reactionCounts,
    };

    log.info(`[Post-Service] Pobrano post o id: ${id}`);
    res.status(200).json(postWithReactions);
  } catch (err) {
    log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania posta o id: " + id,
    });
  }
};

export const getPostsByUserId = async (req, res) => {
  const log = req.log;
  const userId = req.user.id;

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
          COALESCE(
            (
              SELECT json_agg(
                json_build_object('image_id', pi.image_id, 'image_order', pi.image_order)
                ORDER BY pi.image_order
              )
              FROM "Post_Images" pi
              WHERE pi.post_id = p.id
            ),
            '[]'::json
          ) as images,
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
      [userId],
    );

    log.info(`[Post-Service] Pobrano posty użytkownika o id: ${userId}`);
    res.status(200).json(result.rows);
  } catch (err) {
    log.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas pobierania postów użytkownika",
    });
  }
};

export const createPost = async (req, res) => {
  const log = req.log;
  const { content, location_id, location_type, images } = req.body;
  const creatorId = req.user.id;

  const imagesPayload = normalizeImagesPayload(images);
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO "Posts" (creator_id, "Text", location_id, location_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, created_at, "Text", location_id, location_type, creator_id`,
      [creatorId, content, location_id || null, location_type || null],
    );
    const newPost = result.rows[0];

    const insertedImages = await attachImages(
      client,
      newPost.id,
      imagesPayload,
      log,
    );

    await client.query("COMMIT");

    publishEvent("post.created", {
      postId: newPost.id,
      creatorId: newPost.creator_id,
      images: insertedImages,
    });

    log.info(`[Post-Service] Stworzono post o id: ${newPost.id}`);
    res.status(201).json({ ...newPost, images: insertedImages });
  } catch (err) {
    await client.query("ROLLBACK");
    log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia posta",
    });
  } finally {
    client.release();
  }
};

export const updatePost = async (req, res) => {
  const log = req.log;
  const { id } = req.params;
  const { content } = req.body;

  try {
    const result = await db.query(
      `UPDATE "Posts"
      SET "Text" = $1
      WHERE id = $2 AND deleted = false
      RETURNING id, created_at, "Text", location_id, location_type, creator_id`,
      [content, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono posta o id: " + id });
    }

    log.info(`[Post-Service] Zaktualizowano post o id: ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    log.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas aktualizacji posta o id: " + id,
    });
  }
};

export const deletePost = async (req, res) => {
  const log = req.log;
  const { id } = req.params;

  try {
    const isDeleted = await db.query(
      `SELECT deleted FROM "Posts" WHERE id = $1`,
      [id],
    );

    if (isDeleted.rows.length !== 0 && isDeleted.rows[0].deleted) {
      return res.status(404).json({ message: "Post został już usunięty" });
    }

    await db.query(
      `UPDATE "Posts"
      SET deleted = true
      WHERE id = $1 AND deleted = false`,
      [id],
    );

    log.info(`[Post-Service] Usunięto post o id: ${id}`);
    res.status(200).json({ message: "Post został usunięty" });
  } catch (err) {
    log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas usuwania posta o id: " + id,
    });
  }
};
