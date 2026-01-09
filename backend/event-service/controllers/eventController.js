import * as db from '../db/index.js';

export const getEvents = async (req, res) => {
  try {
    // const result = await db.query('SELECT * FROM events ORDER BY event_date ASC');
    // res.json(result.rows);
    res.json({ message: "Lista eventów (tu będzie SELECT * FROM events)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, description, event_date, location } = req.body;
  try {
    // const result = await db.query(
    //   'INSERT INTO events (title, description, event_date, location, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    //   [title, description, event_date, location, req.user.id]
    // );
    res.status(201).json({ message: "Event stworzony!", data: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};