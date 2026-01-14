import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import url from "url";
import jwt from "jsonwebtoken";

import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Chat-Service] Otrzymano: ${req.method} ${req.url}`);
  next();
});

app.use("/chats", chatRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true }); 

const clients = new Map();

server.on('upgrade', (request, socket, head) => {
    // Sprawdzamy, czy żądanie jest na naszą dedykowaną ścieżkę WebSocket
    if (url.parse(request.url).pathname === '/ws') { 
        wss.handleUpgrade(request, socket, head, (ws) => {
            // Jeśli tak, "przekazujemy" połączenie do serwera WebSocket
            wss.emit('connection', ws, request);
        });
    } else {
        // Jeśli nie, niszczymy socket, aby Express nie musiał go obsługiwać
        socket.destroy();
    }
});

wss.on("connection", (ws, req) => {
  const token = url.parse(req.url, true).query.token;
  let userId;

  if (!token) {
    console.log("[Chat-Service] Brak tokena w zapytaniu");
    ws.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (error) {
    console.log("[Chat-Service] Nieprawidłowy token");
    ws.close();
    return;
  }

  console.log("[Chat-Service] Nowy klient połączony", userId);
  clients.set(userId, ws);

  ws.on("message", (message) => {
    console.log(`[Chat-Service] Otrzymano wiadomość od klienta: ${message}`);
  });

  ws.on("close", () => {
    console.log("[Chat-Service] Klient rozłączony", userId);
    clients.delete(userId);
  });
});

app.set("wss", wss);
app.set("clients", clients);

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => console.log(`🚀 Chat-Service running on port ${PORT}`));

app.use(errorHandler);
