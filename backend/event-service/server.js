import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/events.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Ścieżka bazowa dla serwisu
app.use('/api/events', eventRoutes);

app.listen(PORT, () => {
  console.log(`[Event-Service] Serwer działa na porcie ${PORT}`);
});