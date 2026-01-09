import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import { posts } from "../controllers/postController.js";

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

export const isOwnerOrAdmin = (req, res, next) => {
  // req.user został ustawiony wcześniej przez verifyToken
  const authenticatedUserId = Number(req.user.id);
  const postIdFromParams = Number(req.params.id);

  const post = posts.find((p) => p.id === postIdFromParams);

  if (!post) {
    return res.status(404).json({ message: "Nie znaleziono posta o tym ID" });
  }

  if (
    authenticatedUserId === Number(post.userId) ||
    req.user.role === "admin"
  ) {
    next();
  } else {
    return res.status(403).json({
      message:
        "Nie masz uprawnień do modyfikacji tego zasobu (Ownership required)",
    });
  }
};
