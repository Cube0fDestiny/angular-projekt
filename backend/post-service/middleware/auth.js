import dotenv from "dotenv";
dotenv.config();
import * as db from "../db/index.js";

export const attachUserFromHeaders = async (req, res, next) => {
  const userDataHeader = req.headers["x-user-data"];

  if (!userDataHeader) {
    return next();
  }

  try {
    const userData = JSON.parse(userDataHeader);
    req.user = userData;
    next();
  } catch (error) {
    console.log(error + " Nieprawidłowy lub wygasły token");
    return res.status(401).json({ message: "Nieprawidłowy lub wygasły token" });
  }
};

export const requireAuth = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Brak autoryzacji" });
  }
  next();
};

export const isPostOwner = async (req, res, next) => {
  const authenticatedUserId = req.user.id;
  const postId = req.params.id;

  try {
    const result = await db.query(
      'SELECT creator_id FROM "Posts" WHERE id = $1',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post nie istnieje" });
    }

    const postCreatorId = result.rows[0].creator_id;
    if (authenticatedUserId === postCreatorId || req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        message: "Nie jesteś właścicielem tego posta!",
        debug: { user: authenticatedUserId, owner: postCreatorId },
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Błąd serwera podczas sprawdzania uprawnień: " + err.message,
      });
  }
};

export const isCommentOwner = async (req, res, next) => {
  const authenticatedUserId = req.user.id;
  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json({ message: "ID komentarza jest wymagane" });
  }

  try {
    const result = await db.query(
      'SELECT creator_id FROM "Post_Comments" WHERE id = $1',
      [commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Komentarz nie istnieje" });
    }

    const commentCreatorId = result.rows[0].creator_id;
    if (authenticatedUserId === commentCreatorId || req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        message: "Nie jesteś własącicielem tego komentarza!",
        debug: { user: authenticatedUserId, owner: commentCreatorId },
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Błąd serwera podczas sprawdzania uprawnień: " + err.message,
      });
  }
};
