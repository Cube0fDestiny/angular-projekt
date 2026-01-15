import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/events.js';
import { errorHandler } from './middleware/errorHandler.js';

const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.use("/events", eventRoutes);

app.listen(PORT, () => {
  logger.info(`[Event-Service] Serwer działa na porcie ${PORT}`);
});

app.use(errorHandler);