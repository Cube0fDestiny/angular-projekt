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
app.use(
  "/api/posts",
  createProxyMiddleware({
    target: "http://localhost:3002/posts",
    changeOrigin: true,
  })
);

app.use(
  "/api/events",
  createProxyMiddleware({
    target: "http://localhost:3003/events",
    changeOrigin: true,
  })
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gateway na porcie ${PORT} gotowy do pracy!`);
});
