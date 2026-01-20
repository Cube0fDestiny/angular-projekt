import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";

import imageRoutes from "./routes/imageRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const logger = pino({
  name: "ImageService",
  transport: { target: "pino-pretty" },
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use("/images", imageRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => logger.info(`🚀 Image-Service running on port ${PORT}`));

app.use(errorHandler);