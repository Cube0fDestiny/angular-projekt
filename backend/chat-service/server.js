import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import * as db from "./db/index.js";

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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: Token not provided."));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token."));
  }
})

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Użytkownik połączony ${socket.user.name}. Socket ID: ${socket.id}`);

  socket.join(socket.user.id);

  socket.on('joinChatRoom', async (chatId) => {
    try {
      const result = await db.query(
        `SELECT 1 FROM "Chat_Participants" WHERE chat_id = $1 AND user_id = $2`,
        [chatId, socket.user.id]
      );

      if (result.rowCount > 0) {
        socket.join(chatId);
        console.log(`[Socket.IO] Użytkownik ${socket.user.id} dołączony do czatu o id: ${chatId}`);
      } else {
        console.warn(`[Socket.IO] Użytkownik ${socket.user.id} nie jest członkiem czatu o id: ${chatId}`);
      }
    } catch (err) {
      console.error(err + " Błąd serwera podczas weryfikacji uczestnika czatu.");
      socket.emit('error', '[Socket.IO] Błąd serwera podczas weryfikacji uczestnika czatu.');
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Użytkownik ${socket.user.id} rozłączony');
  });
});

app.set("io", io);

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => console.log(`🚀 Chat-Service running on port ${PORT}`));

app.use(errorHandler);
