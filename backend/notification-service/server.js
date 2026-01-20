import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import userRoutes from "./routes/users.js"; // <-- .js !!!
import pino from "pino";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectRabbitMQ } from "./utils/rabbitmq-client.js";

export const logger = pino({
  name: "UserService",
  transport: { target: "pino-pretty" },
});

const startServer = async () => {
  await connectRabbitMQ();

  const app = express();
  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  app.use("/users", userRoutes);

  app.use(errorHandler);

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => logger.info(`🚀 User-Service running on port ${PORT}`));
};

startServer().catch((err) => {
  logger.fatal({ error: err }, "User-Service failed to start");
  process.exit(1);
});
