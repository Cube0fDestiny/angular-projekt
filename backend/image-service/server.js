import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import imageRoutes from "./routes/images.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Image-Service] Otrzymano: ${req.method} ${req.url}`);
    next();
});

app.use("/images", imageRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🚀 Image-Service running on port ${PORT}`));

app.use(errorHandler);