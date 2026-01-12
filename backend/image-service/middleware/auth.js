import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import * as db from "../db/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Brak autoryzacji" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Nieprawidłowy lub wygasły token" });
  }
};