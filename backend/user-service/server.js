import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js'; // <-- .js !!!

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
