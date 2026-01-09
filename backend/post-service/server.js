import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import postRoutes from "./routes/posts.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Post-Service] Otrzymano: ${req.method} ${req.url}`);
  next();
});

app.use("/posts", postRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Post-Service działa na porcie ${PORT}`));

app.use(errorHandler);
