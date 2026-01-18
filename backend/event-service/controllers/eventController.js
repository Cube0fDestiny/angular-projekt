import * as db from "../db/index.js";
import { publishEvent } from "../utils/rabbitmq-client.js";

export const getAllEvents = async (req, res) => {
  const log = req.log;
  try {
    const result = await db.query(
      `SELECT id, name, bio, event_date, creator_id FROM "Events"
      WHERE deleted = false
      ORDER BY event_date DESC`
    );

    log.info(
      `[Event-Service] Pobrano ${result.rows.length} eventów z bazy danych`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    log.error({ err }, "Błąd serwera podczas pobierania wydarzeń.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania eventów",
    });
  }
};

export const getEventById = async (req, res) => {
  const { id } = req.params;
  const log = req.log;

  try {
    const result = await db.query(
      `SELECT * FROM "Events"
      WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (result.rows.length === 0) {
      log.warn(
        { eventId: id },
        "Nieudana próba pobrania nieistniejącego wydarzenia."
      );
      return res
        .status(404)
        .json({ message: "Nie znaleziono eventu o id: " + id });
    }

    log.info({ eventId: id }, "Pobrano wydarzenie.");
    res.status(200).json(result.rows[0]);
  } catch (err) {
    log.error(
      { err, eventId: id },
      "Błąd serwera podczas pobierania wydarzenia."
    );
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas pobierania eventu o id: " + id,
    });
  }
};

export const getUserEvents = async (req, res) => {
  const user_id = req.user.id;
  const log = req.log;

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

    log.info(
      { userId, eventCount: result.rowCount },
      "Pobrano wydarzenia dla użytkownika."
    );
    res.status(200).json(result.rows);
  } catch (err) {
    log.error(
      { err, userId },
      "Błąd serwera podczas pobierania wydarzeń użytkownika."
    );
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania eventów",
    });
  }
};

export const createEvent = async (req, res) => {
  const log = req.log;
  const { name, bio, event_date, header_picture_id, profile_picture_id } =
    req.body;
  const creator_id = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO "Events" (name, bio, event_date, creator_id, header_picture_id, profile_picture_id) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, bio, event_date, creator_id, header_picture_id, profile_picture_id`,
      [name, bio, event_date, creator_id, header_picture_id, profile_picture_id]
    );
    const newEvent = result.rows[0];

    log.info(
      { eventId: newEvent.id, creatorId: creator_id },
      "Stworzono nowe wydarzenie."
    );
    publishEvent("event.created", {
      eventId: newEvent.id,
      name: name,
      creatorId: creator_id,
      eventDate: event_date,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json({ message: "Event stworzony!", data: newEvent });
  } catch (err) {
    log.error(
      { err, creatorId: creator_id, body: req.body },
      "Błąd serwera podczas tworzenia wydarzenia."
    );
    res.status(500).json({
      error: err.message + " Błąd serwera podczas tworzenia eventu o id",
    });
  }
};

export const updateEvent = async (req, res) => {
  const log = req.log;
  const { id } = req.params;
  const { name, bio, event_date } = req.body;

  try {
    const currentEventResult = await db.query(
      `SELECT * FROM "Events" WHERE id = $1 AND deleted = false`,
      [id]
    );

    if (currentEventResult.rows.length === 0) {
      log.warn({ eventId: id }, "Nieudana próba aktualizacji nieistniejącego wydarzenia.");
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

    log.info({ eventId: id }, "Zaktualizowano wydarzenie.");
    publishEvent("event.updated", {
      eventId: id,
      name: updatedData.name,
      bio: updatedData.bio,
      eventDate: updatedData.event_date,
      timestamp: new Date().toISOString(),
    });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    log.error({ err, eventId: id }, "Błąd serwera podczas aktualizacji wydarzenia.");
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas aktualizacji eventu o id: " + id,
    });
  }
};

export const deleteEvent = async (req, res) => {
  const log = req.log;
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

    log.info({ eventId: id }, "Usunięto wydarzenie.");
    publishEvent("event.deleted", {
      eventId: id,
      timestamp: new Date().toISOString(),
    });
    res.status(200).json({ message: "Event został usunięty" });
  } catch (err) {
    log.error({ err, eventId: id }, "Błąd serwera podczas usuwania wydarzenia.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas usuwania eventu o id: " + id,
    });
  }
};

export const toggleFollowEvent = async (req, res) => {
  const log = req.log;
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
      log.info({ eventId: id }, "Usunięto follow o id: " + id);
      publishEvent("event.unfollowed", {
        eventId: id,
        userId: user_id,
        timestamp: new Date().toISOString(),
      });
      return res.status(200).json({ message: "Follow został usunięty" });
    }

    await db.query(
      `INSERT INTO "Event_Follows" (event_id, user_id) VALUES ($1, $2)`,
      [id, user_id]
    );

    log.info({ eventId: id }, "Dodano follow o id: " + id);
    publishEvent("event.followed", {
      eventId: id,
      userId: user_id,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json({ message: "Follow został dodany" });
  } catch (err) {
    log.error({ err, eventId: id }, "Błąd serwera podczas dodawania followa.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas zmiany statusu obserwacji",
    });
  }
};

export const getEventFollowers = async (req, res) => {
  const log = req.log;
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

    log.info({ eventId: id }, "Pobrano followerów.");
    res.status(200).json(result.rows);
  } catch (err) {
    log.error({ err, eventId: id }, "Błąd serwera podczas pobierania followerów.");
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania followerów",
    });
  }
};
