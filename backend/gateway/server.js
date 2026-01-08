import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
app.use(cors());

// Konfiguracja dla User Service
app.use(
  "/api/users",
  createProxyMiddleware({
    target: "http://localhost:3001/users",
    changeOrigin: true,
  })
);

// Konfiguracja dla Post Service
app.use('/api/posts', createProxyMiddleware({
  target: 'http://localhost:3002', // bez dodatkowych ścieżek na końcu!
  changeOrigin: true,
  pathRewrite: {
    '^/api/posts': '/api/posts', // przesyła całą ścieżkę bez zmian
  },
}));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gateway na porcie ${PORT} gotowy do pracy!`);
});
