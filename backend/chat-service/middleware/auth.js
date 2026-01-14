import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import * as db from "../db/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Brak autoryzacji" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: error + " Nieprawidłowy lub wygasły token" });
    }
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
