import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { gatewayVerifyToken } from "./middleware/auth.js";

const service = [
  {
    route: "/users",
    target: "http://localhost:3001/users",
  },
  {
    route: "/posts",
    target: "http://localhost:3002/posts",
  },
  {
    route: "/events",
    target: "http://localhost:3003/events",
  },
  {
    route: "/images",
    target: "http://localhost:3004/images",
  },
  {
    route: "/groups",
    target: "http://localhost:3005/groups",
  },
  // {
  //   route:"/chats",
  //   target:"http://localhost:3006"
  // },
  {
    route: "/notifications",
    target: "http://localhost:3007/notifications",
  },
];

const app = express();
const server = http.createServer(app);

app.use(cors());
// app.use(express.json());
app.use(gatewayVerifyToken);

// Loggujemy otrzymane requesty i sprawdzamy token
app.use((req, res, next) => {
  console.log(`[Gateway] Otrzymano: ${req.method} ${req.url}`);
  next();
});

// Konfiguracja Proxy dla serwisów
service.forEach(({ route, target }) => {
  const proxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite: {
      // Usuwa prefiks - /example/123 -> /123
      [`^${route}`]: "",
    },
    // onProxyReq: (proxyReq, req, res) => {
    //   if (req.headers["x-user-data"]) {
    //     proxyReq.setHeader("x-user-data", req.headers["x-user-data"]);
    //   }
    // },
  };
  app.use(route, createProxyMiddleware(proxyOptions));
});

const chatServiceProxy = createProxyMiddleware({
  target: "http://localhost:3006/chats",
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "^/chats": "",
  },
  // onProxyReq: (proxyReq, req, res) => {
  //   if (req.headers["x-user-data"]) {
  //     proxyReq.setHeader("x-user-data", req.headers["x-user-data"]);
  //   }
  // },
});

app.use("/chats", chatServiceProxy);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Gateway running on port ${PORT}`));

server.on("upgrade", (req, socket, head) => {
  console.log(`[Gateway] Próba uaktualnienia do WebSocket serwisu ${req.url}`);
  if (req.url.startsWith("/chats")) {
    chatServiceProxy.ws(req, socket, head);
  } else {
    socket.destroy();
  }
});
