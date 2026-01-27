import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import * as db from "../db/index.js";
import { hashPassword, verifyPassword } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, name, surname, email, bio, is_company, created_at, profile_picture_id, profile_header
      FROM "Users"
      WHERE deleted = false`,
    );

    const users = result.rows.map((row) => ({
      id: row.user_id,
      name: row.name,
      surname: row.surname,
      email: row.email,
      bio: row.bio,
      is_company: row.is_company,
      created_at: row.created_at,
      profile_picture_id: row.profile_picture_id,
      header_picture_id: row.profile_header,
      avatar: `https://i.pravatar.cc/150?u=${row.email}`,
    }));

    req.log.info(
      `[User-Service] Pobrano ${users.length} użytkowników z bazy danych`,
    );
    res.status(200).json(users);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas pobierania użytkowników",
    });
  }
};

export const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT user_id, name, surname, email, bio, is_company, created_at, profile_picture_id, profile_header
      FROM "Users"
      WHERE user_id = $1 AND deleted = false`,
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono użytkownika o id: " + id });
    }

    const row = result.rows[0];

    const user = {
      id: row.user_id,
      name: row.name,
      surname: row.surname,
      email: row.email,
      bio: row.bio,
      is_company: row.is_company,
      created_at: row.created_at,
      profile_picture_id: row.profile_picture_id,
      header_picture_id: row.profile_header,
      avatar: `https://i.pravatar.cc/150?u=${row.email}`,
    };

    req.log.info(`[User-Service] Pobrano profil użytkownika ID: ${id}`);
    res.status(200).json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas pobierania profilu użytkownika",
    });
  }
};

export const register = async (req, res) => {
  const { name, surname, email, password, is_company } = req.body;

  try {
    const checkUser = await db.query(
      `SELECT * FROM "Users" WHERE email = $1 and deleted = false`,
      [email],
    );

    if (checkUser.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Użytkownik o podanym adresie email juz istnieje" });
    }

    const { salt, hash } = hashPassword(password);

    const result = await db.query(
      `INSERT INTO "Users" (name, surname, email, password, salt, is_company) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
      [name, surname, email, hash, salt, is_company || false],
    );

    const newUser = result.rows[0];

    const token = jwt.sign(
      {
        id: newUser.user_id,
        email: email,
        role: "user",
      },
      JWT_SECRET,
      {
        expiresIn: "12h",
      },
    );

    req.log.info(
      `[User-Service] Zarejestrowano nowego użytkownika ID: ${newUser.user_id}`,
    );

    res.status(201).json({
      user: {
        id: newUser.user_id,
        name: name,
        surname: name,
        email: email,
        is_company: is_company,
        profile_picture_id: null,
        header_picture_id: null,
        avatar: `https://i.pravatar.cc/150?u=${email}`,
      },
      token: token,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error:
        err.message + " Błąd serwera podczas rejestracji nowego użytkownika",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      `SELECT user_id, name, surname, email, password, salt, is_company, deleted, profile_picture_id, profile_header
      FROM "Users"
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło" });
    }
    if (user.deleted) {
      return res.status(401).json({ message: "Konto zostało usunięte" });
    }

    const isValid = verifyPassword(password, user.salt, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło" });
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        email: email,
        role: "user",
      },
      JWT_SECRET,
      {
        expiresIn: "12h",
      },
    );

    req.log.info(`[User-Service] Zalogowano użytkownika ID: ${user.user_id}`);

    res.status(200).json({
      user: {
        id: user.user_id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        is_company: user.is_company,
        profile_picture_id: user.profile_picture_id,
        header_picture_id: user.profile_header,
        avatar: `https://i.pravatar.cc/150?u=${user.email}`,
      },
      token: token,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas logowania",
    });
  }
};

export const updateProfile = async (req, res) => {
  const { id } = req.params;
  const log = req.log;

  const {
    name,
    surname,
    email,
    bio,
    is_company,
    profile_picture_id,
    header_picture_id,
    profile_header,
  } = req.body;

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Brak danych do aktualizacji." });
  }

  try {
    const currentRes = await db.query(
      `SELECT * FROM "Users" WHERE user_id = $1 AND deleted = false`,
      [id],
    );

    if (currentRes.rows.length === 0) {
      log.warn(
        { userId: id },
        "Nieudana próba aktualizacji nieistniejącego użytkownika.",
      );
      return res
        .status(404)
        .json({ message: "Nie znaleziono użytkownika do edycji" });
    }

    const current = currentRes.rows[0];
    const finalHeaderPictureId =
      header_picture_id !== undefined ? header_picture_id : profile_header;

    const updatedData = {
      name: name || current.name,
      surname: surname || current.surname,
      email: email || current.email,
      bio: bio !== undefined ? bio : current.bio,
      is_company: is_company !== undefined ? is_company : current.is_company,
      profile_picture_id:
        profile_picture_id !== undefined
          ? profile_picture_id
          : current.profile_picture_id,
      profile_header:
        finalHeaderPictureId !== undefined
          ? finalHeaderPictureId
          : current.profile_header,
    };

    const fields = Object.keys(updatedData);
    const setString = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(", ");
    const values = Object.values(updatedData);

    const updateQuery = `
            UPDATE "Users"
            SET ${setString}
            WHERE user_id = $${fields.length + 1} AND deleted = false
            RETURNING user_id, profile_picture_id, profile_header
        `;

    const result = await db.query(updateQuery, [...values, id]);
    const updatedUser = result.rows[0];

    log.info({ userId: id }, "Pomyślnie zaktualizowano profil użytkownika.");
    res.status(200).json({
      message: "Profil został zaktualizowany",
      user_id: updatedUser.user_id,
      profile_picture_id: updatedUser.profile_picture_id,
      header_picture_id: updatedUser.profile_header,
    });
  } catch (err) {
    log.error(
      { err, userId: id },
      "Błąd serwera podczas aktualizacji profilu.",
    );
    res.status(500).json({
      error: "Błąd serwera podczas aktualizacji profilu",
    });
  }
};
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE "Users"
      SET deleted = true
      WHERE user_id = $1 AND deleted = false
      RETURNING user_id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono użytkownika do usunęcia" });
    }

    req.log.info(`Usunięto profil użytkownika ID: ${id}`);

    res.status(200).json({
      message: "Profil został usunięty",
      user_id: result.rows[0].user_id,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: err.message + " Błąd serwera podczas usuwania profilu",
    });
  }
};
