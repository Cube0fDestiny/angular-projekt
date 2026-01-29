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

// --- FIX 1: Strip /api prefix from HTTP requests ---
// This fixes the "404 Not Found" during Socket.IO polling on localhost
app.use((req, res, next) => {
  if (req.url.startsWith("/api")) {
    req.url = req.url.replace("/api", "");
  }
  next();
});

// --- FIX 2: Skip Auth for Public Routes ---
// This prevents the Gateway from blocking Login/Register or Socket Handshakes
const publicRoutes = ["/users/login", "/users/register", "/chats/socket", "/notifications/socket"];

app.use((req, res, next) => {
  // Check if the current path (after stripping /api) matches a public route
  if (publicRoutes.some((route) => req.url.startsWith(route))) {
    return next();
  }
  return gatewayVerifyToken(req, res, next);
});

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

// --- CHAT PROXY ---
const chatServiceProxy = createProxyMiddleware({
  target: "http://chat-service:3006",
  changeOrigin: true,
  ws: true,
  // Express strips '/chats', so we add it back because the backend expects /chats/socket
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

// --- NOTIFICATION PROXY ---
const notificationServiceProxy = createProxyMiddleware({
  target: "http://notification-service:3007",
  changeOrigin: true,
  ws: true,
  // Express strips '/notifications', so we add it back because the backend expects /notifications/socket
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

// --- FIX 3: WebSocket Upgrade Handling ---
server.on("upgrade", (req, socket, head) => {
  // Strip /api if present (for local testing without Caddy)
  if (req.url.startsWith("/api")) {
    req.url = req.url.replace("/api", "");
  }

  logger.info({ url: req.url }, `Processing WebSocket Upgrade`);

  if (req.url.startsWith("/chats")) {
    // Strip '/chats' here. The proxy 'pathRewrite' above will add it back.
    // This logic loop ensures the path is clean when it enters the proxy middleware.
    req.url = req.url.replace("/chats", ""); 
    chatServiceProxy.upgrade(req, socket, head);
  } else if (req.url.startsWith("/notifications")) {
    // Strip '/notifications' here.
    req.url = req.url.replace("/notifications", "");
    notificationServiceProxy.upgrade(req, socket, head);
  } else {
    logger.warn({ url: req.url }, "WebSocket connection rejected: No matching route");
    socket.destroy();
  }
});