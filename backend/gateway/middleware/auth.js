import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const gatewayVerifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userDataString = JSON.stringify(decoded);

      req.headers["x-user-data"] = userDataString;
    }
    next();
  } catch (error) {
    // Jeśli token jest, ale jest nieprawidłowy, odrzuć żądanie
    return res
      .status(401)
      .json({ message: "[Gateway]: Nieprawidłowy lub wygasły token: " + error.message });
  }
};
