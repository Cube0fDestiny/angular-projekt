import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/events.js';
import { errorHandler } from './middleware/errorHandler.js';
import { connectRabbitMQ } from './utils/rabbitmq-client.js';

dotenv.config();

export const logger = pino({
  name: 'EventService',
  transport: { target: 'pino-pretty' },
});

const startServer = async () => {
  await connectRabbitMQ();

  const app = express();
  const PORT = process.env.PORT || 3003;

  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  app.use("/events", eventRoutes);

  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`🚀 Event-Service running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  logger.fatal({ error: err }, "Event-Service failed to start");
  process.exit(1);
});