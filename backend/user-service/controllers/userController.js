import { query } from '../db/index.js';

export const getAllUsers = async (req, res) => {
  const result = await query('SELECT * FROM users');
  res.json(result.rows);
};

export const createUser = async (req, res) => {
  const { username, email, password_hash } = req.body;
  const result = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING *',
    [username, email, password_hash]
  );
  res.status(201).json(result.rows[0]);
};
