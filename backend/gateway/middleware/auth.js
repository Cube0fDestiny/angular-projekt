import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware do weryfikacji tokena JWT. Jeśli token jest poprawny,
 * dekoduje go i umieszcza jego zawartość jako string w nagłówku 'x-user-data'.
 * Applies to all requests including WebSocket upgrades.
 */
export const gatewayVerifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.headers['x-user-data'] = JSON.stringify(decoded);
            }
        }
        next();
    } catch (error) {
        // Jeśli token jest obecny, ale nieprawidłowy lub wygasły
        return res.status(401).json({ message: "Nieprawidłowy lub wygasły token" });
    }
};

/**
 * Middleware zabezpieczające, które sprawdza, czy poprzednie middleware
 * (gatewayVerifyToken) pomyślnie zweryfikowało token i dodało nagłówek 'x-user-data'.
 * Jeśli nie, odrzuca żądanie.
 */
export const requireAuth = (req, res, next) => {
    if (req.headers['x-user-data']) {
        return next(); // Użytkownik jest uwierzytelniony, przejdź dalej
    }
    // Jeśli nie ma nagłówka, oznacza to brak ważnego tokena
    res.status(401).json({ message: "Wymagana autoryzacja." });
};
