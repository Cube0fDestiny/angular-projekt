import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const PBKDF2_ITERATIONS = process.env.PBKDF2_ITERATIONS;
const PBKDF2_KEYLEN = process.env.PBKDF2_KEYLEN;
const PBKDF2_DIGEST = process.env.PBKDF2_DIGEST;

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
  const authenticatedUserId = req.user.id;
  const targetUserId = parseInt(req.params.id);

  if (authenticatedUserId === targetUserId || req.user.role === 'admin') {
    next(); // To Twój profil lub jesteś adminem - przechodzisz dalej
  } else {
    return res.status(403).json({ 
      message: "Nie masz uprawnień do modyfikacji tego zasobu (Ownership required)" 
    });
  }
};

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return { salt, hash };
}

export const verifyPassword = (password, salt, hash) => {
  const inputHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return inputHash === hash;
}