import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "usersdb",
  password: process.env.DB_PASSWORD || "admin123",
  port: process.env.DB_PORT || 5432,
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
