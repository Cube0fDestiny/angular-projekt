import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import groupRoutes from './routes/groupRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { connectRabbitMQ } from './utils/rabbitmq-client.js';

dotenv.config();

export const logger = pino({
  name: 'GroupService',
  transport: { target: 'pino-pretty' },
});

const startServer = async () => {
  await connectRabbitMQ();

  const app = express();
  const PORT = process.env.PORT || 3005;

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  app.use("/groups", groupRoutes);

  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`[Group-Service] Serwer działa na porcie ${PORT}`);
  });
};

startServer().catch((err) => {
  logger.error({ error: err }, "Failed to start server");
  process.exit(1);
});