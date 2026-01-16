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

export const isEventOwner = async (req, res, next) => {
    const authenticatedUserId = req.user.id;
    const eventId = req.params.id;
    try {
        const result = await db.query(
            'SELECT creator_id FROM "Events" WHERE id = $1',
            [eventId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Wydarzenie nie istnieje" });
        }
        const eventCreatorId = result.rows[0].creator_id;
        // Pozwól na dostęp właścicielowi LUB administratorowi
        if (authenticatedUserId === eventCreatorId || req.user.role === "admin") {
            next();
        } else {
            return res.status(403).json({ message: "Nie jesteś właścicielem tego wydarzenia!" });
        }
    } catch (err) {
        res.status(500).json({ error: "Błąd serwera podczas sprawdzania uprawnień." });
    }
};
