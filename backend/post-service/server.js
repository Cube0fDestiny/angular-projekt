import dotenv from "dotenv";
dotenv.config();

import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import cors from "cors";
import postRoutes from "./routes/posts.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectRabbitMQ } from "./utils/rabbitmq-client.js";

export const logger = pino({
  name: "PostService",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
});

const startServer = async () => {
  await connectRabbitMQ();

  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());
  app.use("/posts", postRoutes);
  app.use(errorHandler);

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () =>
    logger.info(`🚀 Post-Service running on port ${PORT}`),
  );
};

startServer().catch((err) => {
  logger.fatal({ error: err }, "Post-Service failed to start");
  process.exit(1);
});