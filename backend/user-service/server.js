import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js'; // <-- .js !!!

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Wystąpił wewnętrzny błąd serwera",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
