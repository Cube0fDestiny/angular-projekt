import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import pino from "pino";
import pinoHttp from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { gatewayVerifyToken } from "./middleware/auth.js";
import orchestrationRoutes from "./routes/orchestrationRoutes.js";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: { target: "pino-pretty" },
});

const services = [
  {
    route: "/users",
    target: "http://user-service:3001/users",
  },
  {
    route: "/posts",
    target: "http://post-service:3002/posts",
  },
  {
    route: "/events",
    target: "http://event-service:3003/events",
  },
  {
    route: "/images",
    target: "http://image-service:3004/images",
  },
  {
    route: "/groups",
    target: "http://group-service:3005/groups",
  },
  {
    route: "/notifications",
    target: "http://notification-service:3007/notifications",
  },
];

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(pinoHttp({ logger }));
app.use(gatewayVerifyToken);

app.use("/", orchestrationRoutes);

services.forEach(({ route, target }) => {
  const proxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: "",
    },
    onError: (err, req, res) => {
      req.log.error({ err, service: route }, "Błąd proxy");
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Usługa jest tymczasowo niedostępna.",
          service: route,
        }),
      );
    },
  };
  app.use(route, createProxyMiddleware(proxyOptions));
});

const chatServiceProxy = createProxyMiddleware({
  target: "http://chat-service:3006",
  changeOrigin: true,
  ws: true,
  // Express strips the mount path; add it back so Socket.IO path /chats/socket works
  pathRewrite: (path) => `/chats${path}`,
  onError: (err, req, res) => {
    req.log.error({ err, service: "/chats" }, "Bład proxy");
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Usługa jest tymczasowo niedostępna.",
        service: "/chats",
      }),
    );
  },
});

app.use("/chats", chatServiceProxy);

const notificationServiceProxy = createProxyMiddleware({
  target: "http://notification-service:3007",
  changeOrigin: true,
  ws: true,
  // Restore mount path for Socket.IO at /notifications/socket
  pathRewrite: (path) => `/notifications${path}`,
  onError: (err, req, res) => {
    req.log.error({ err, service: "/notifications" }, "Błåd proxy");
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Usługa jest tymczasowo niedostępna.",
        service: "/notifications",
      }),
    );
  },
});

app.use("/notifications", notificationServiceProxy);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => logger.info(`🚀 Gateway działa na porcie ${PORT}`));

server.on("upgrade", (req, socket, head) => {
  // 1. Strip '/api' if present (Fixes the issue when running locally)
  if (req.url.startsWith("/api")) {
    req.url = req.url.replace("/api", "");
  }

  logger.info({ url: req.url }, `Processing WebSocket Upgrade`);

  if (req.url.startsWith("/chats")) {
    // 2. Strip '/chats' because the proxy 'pathRewrite' will add it back
    req.url = req.url.replace("/chats", ""); 
    chatServiceProxy.upgrade(req, socket, head);
  } else if (req.url.startsWith("/notifications")) {
    // 2. Strip '/notifications' because the proxy 'pathRewrite' will add it back
    req.url = req.url.replace("/notifications", "");
    notificationServiceProxy.upgrade(req, socket, head);
  } else {
    logger.warn({ url: req.url }, "WebSocket connection rejected: No matching route");
    socket.destroy();
  }
});
