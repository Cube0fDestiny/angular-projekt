import * as db from "../db/index.js";

export const getAllEvents = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, bio, event_date, creator_id FROM "Events"
      WHERE deleted = false
      ORDER BY event_date DESC`
    );

    console.log(
      `[Event-Service] Pobrano ${result.rows.length} eventów z bazy danych`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania eventów",
    });
  }
};

export const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM "Events"
      WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono eventu o id: " + id });
    }

    console.log(`[Event-Service] Pobrano event o id: ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas pobierania eventu o id: " + id,
    });
  }
};

export const getUserEvents = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `
      WITH UserEvents AS (
        SELECT
          id, name, bio, event_date, creator_id, 
          'created' as user_relation,
          1 AS priority
        FROM "Events"
        WHERE creator_id = $1 AND deleted = false

        UNION

        SELECT
          e.id, e.name, e.bio, e.event_date, e.creator_id, 'followed' as user_relation,
          2 AS priority
        FROM "Events" as e
        JOIN "Event_Follows" AS ef ON e.id = ef.event_id
        WHERE ef.user_id = $1 AND e.deleted = false
      )

      SELECT DISTINCT ON (id)
        id, name, bio, event_date, creator_id, user_relation
      FROM UserEvents
      ORDER BY id, priority ASC; 
      `,
      [user_id]
    );

    console.log(
      `[Event-Service] Pobrano ${result.rows.length} eventów z bazy danych`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania eventów",
    });
  }
};

export const createEvent = async (req, res) => {
  const { name, bio, event_date, header_picture_id, profile_picture_id } =
    req.body;
  const creator_id = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO "Events" (name, bio, event_date, creator_id, header_picture_id, profile_picture_id) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, bio, event_date, creator_id, header_picture_id, profile_picture_id`,
      [name, bio, event_date, creator_id, header_picture_id, profile_picture_id]
    );

    console.log(`[Event-Service] Stworzono event o id: ${result.rows[0].id}`);
    res.status(201).json({ message: "Event stworzony!", data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia eventu o id",
    });
  }
};

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, bio, event_date } = req.body;

  try {
    const currentEventResult = await db.query(
      `SELECT * FROM "Events" WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (currentEventResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono eventu do edycji o id: " + id });
    }

    const currentEvent = currentEventResult.rows[0];

    const updatedData = {
      name: req.body.name || currentEvent.name,
      bio: req.body.bio || currentEvent.bio,
      event_date: req.body.event_date || currentEvent.event_date,
    };

    const result = await db.query(
      `UPDATE "Events"
      SET name = $1, bio = $2, event_date = $3
      WHERE id = $4 AND deleted = false
      RETURNING *`,
      [updatedData.name, updatedData.bio, updatedData.event_date, id]
    );

    console.log(`[Event-Service] Zaktualizowano event o id: ${id}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas aktualizacji eventu o id: " + id,
    });
  }
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE "Events"
      SET deleted = true
      WHERE id = $1 AND deleted = false
      RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono eventu o id: " + id });
    }

    console.log(`[Event-Service] Usunięto event o id: ${id}`);
    res.status(204).json({ message: "Event został usunięty" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas usuwania eventu o id: " + id,
    });
  }
};

export const toggleFollowEvent = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const existing = await db.query(
      `SELECT * FROM "Event_Follows" WHERE event_id = $1 AND user_id = $2`,
      [id, user_id]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `DELETE FROM "Event_Follows" WHERE event_id = $1 AND user_id = $2`,
        [id, user_id]
      );
      console.log(
        `[Event-Service] Usunięto follow o id: ${existing.rows[0].id}`
      );
      return res.status(200).json({ message: "Follow został usunięty" });
    }

    await db.query(
      `INSERT INTO "Event_Follows" (event_id, user_id) VALUES ($1, $2)`,
      [id, user_id]
    );

    console.log(`[Event-Service] Dodano follow o id: ${id}`);
    res.status(201).json({ message: "Follow został dodany" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas zmiany statusu obserwacji",
    });
  }
};

export const getEventFollowers = async (req, res) => {
  const { id } = req.params;

  try {
    const eventCheck = await db.query(
      `SELECT * FROM "Events" WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (eventCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono eventu o id: " + id });
    }

    const result = await db.query(
      `SELECT 
        u.user_id,
        u.name,
        u.surname,
        u.profile_picture_id,
        u.is_company
      FROM "Event_Follows" as ef
      JOIN "Users" AS u ON ef.user_id = u.user_id
      WHERE ef.event_id = $1 AND u.deleted = false`,
      [id]
    );

    console.log(`[Event-Service] Pobrano followerów eventu o id: ${id}`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania followerów",
    });
  }
};
