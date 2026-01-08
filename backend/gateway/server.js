import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());

// Mapowanie tras do mikroserwisów
app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3001/users', // adres User Service
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
}));

// Tutaj w przyszłości dodasz /api/posts itp.

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API Gateway (ESM) running on port ${PORT}`);
});