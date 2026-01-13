import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/events.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Event-Service] Otrzymano: ${req.method} ${req.url}`);
    next();
});

app.use("/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`[Event-Service] Serwer działa na porcie ${PORT}`);
});

app.use(errorHandler);