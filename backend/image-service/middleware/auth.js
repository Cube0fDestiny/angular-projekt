import dotenv from "dotenv";
dotenv.config();

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