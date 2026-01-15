import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import pino from "pino";
import pinoHttp from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { gatewayVerifyToken } from "./middleware/auth.js";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
        }
      : undefined,
});

const service = [
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
  // {
  //   route:"/chats",
  //   target:"http://chat-service:3006"
  // },
  {
    route: "/notifications",
    target: "http://notification-service:3007/notifications",
  },
];

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(gatewayVerifyToken);
app.use(pinoHttp({ logger }));

// Konfiguracja Proxy dla serwisów
service.forEach(({ route, target }) => {
  const proxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite: {
      // Usuwa prefiks - /example/123 -> /123
      [`^${route}`]: "",
    },
    onError: (err, req, res) => {
      req.log.error({ err, service: route }, "Błąd proxy");
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Usługa jest tymczasowo niedostępna.",
          service: route,
        })
      );
    },
  };
  app.use(route, createProxyMiddleware(proxyOptions));
});

const chatServiceProxy = createProxyMiddleware({
  target: "http://chat-service:3006/chats",
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "^/chats": "",
  },
  onError: (err, req, res) => {
    req.log.error({ err, service: "/chats" }, "Błąd proxy");
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Usługa jest tymczasowo niedostępna.",
        service: "/chats",
      })
    );
  },
});

app.use("/chats", chatServiceProxy);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => logger.info(`🚀 Gateway running on port ${PORT}`));

server.on("upgrade", (req, socket, head) => {
  logger.info({ url: req.url }, `Próba uaktualnienia połączenia do WebSocket`);
  if (req.url.startsWith("/chats")) {
    chatServiceProxy.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});
