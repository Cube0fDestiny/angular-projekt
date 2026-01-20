import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import groupRoutes from './routes/groupRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const logger = pino({
  transport:
    { target: 'pino-pretty' },
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.use("/groups", groupRoutes);

app.listen(PORT, () => {
  logger.info(`[Group-Service] Serwer działa na porcie ${PORT}`);
});

app.use(errorHandler);