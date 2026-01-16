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

/**
 * Sprawdza, czy zalogowany użytkownik jest członkiem czatu, do którego próbuje uzyskać dostęp.
 */
export const isChatParticipant = async (req, res, next) => {
    const userId = req.user.id;
    const chatId = req.params.chatId; 

    if (!chatId) {
        return res.status(400).json({ message: "Brak ID czatu w zapytaniu." });
    }

    try {
        const result = await db.query(
            `SELECT 1 FROM "Chat_Participants" WHERE chat_id = $1 AND user_id = $2`,
            [chatId, userId]
        );
        if (result.rowCount > 0) {
            next();
        } else {
            res.status(403).json({ message: "Brak dostępu do tego czatu." });
        }
    } catch (err) {
        res.status(500).json({ error: "Błąd serwera podczas weryfikacji uczestnika czatu." });
    }
};
