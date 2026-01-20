import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import pino from "pino";
import pinoHttp from "pino-http";

import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import * as db from "./db/index.js";
import { connectRabbitMQ } from "./utils/rabbitmq-client.js";

export const logger = pino({
  name: "ChatService",
  transport: { target: "pino-pretty" },
});

const JWT_SECRET = process.env.JWT_SECRET;

const startServer = async () => {
  await connectRabbitMQ();

  const app = express();

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.use("/chats", chatRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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
});

io.on("connection", (socket) => {
  logger.info(
    `[Socket.IO] Użytkownik połączony ${socket.user.name}. Socket ID: ${socket.id}`
  );

  socket.join(socket.user.id);

  socket.on("joinChatRoom", async (chatId) => {
    try {
      const result = await db.query(
        `SELECT 1 FROM "Chat_Participants" WHERE chat_id = $1 AND user_id = $2`,
        [chatId, socket.user.id]
      );

      if (result.rowCount > 0) {
        socket.join(chatId);
        logger.info(
          `[Socket.IO] Użytkownik ${socket.user.id} dołączony do czatu o id: ${chatId}`
        );
      } else {
        logger.warn(
          `[Socket.IO] Użytkownik ${socket.user.id} nie jest członkiem czatu o id: ${chatId}`
        );
      }
    } catch (err) {
      logger.error(
        err + " Błąd serwera podczas weryfikacji uczestnika czatu."
      );
      socket.emit(
        "error",
        "[Socket.IO] Błąd serwera podczas weryfikacji uczestnika czatu."
      );
    }
  });

  socket.on("disconnect", () => {
    logger.info(`[Socket.IO] Użytkownik ${socket.user.id} rozłączony`);
  });
});

app.set("io", io);

const PORT = process.env.PORT || 3006;
server.listen(PORT, () =>
  logger.info(`🚀 Chat-Service running on port ${PORT}`)
);

app.use(errorHandler);
};

startServer().catch((err) => {
  logger.fatal({ error: err }, "Chat-Service failed to start");
  process.exit(1);
});
