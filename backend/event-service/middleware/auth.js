import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import * as db from "../db/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Funkcja skopiowana z post-service - bez zmian
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Brak autoryzacji" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Nieprawidłowy lub wygasły token" });
    }
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
