import express from "express";
import {
  getUserChats,
  createChat,
  getChatMessages,
  createMessage,
} from "../controllers/chatController.js";
import { verifyToken, isChatParticipant } from "../middleware/auth.js";

const router = express.Router();

// Pobierz wszystkie czaty zalogowanego użytkownika
router.get("/", verifyToken, getUserChats);

// Stwórz nowy czat (prywatny lub grupowy)
router.post("/", verifyToken, createChat);

// Pobierz wszystkie wiadomości z konkretnego czatu
// Middleware `isChatParticipant` chroni ten endpoint
router.get("/:chatId/messages", verifyToken, isChatParticipant, getChatMessages);

// Wyślij nową wiadomość do konkretnego czatu
// Middleware `isChatParticipant` chroni ten endpoint
router.post("/:chatId/messages", verifyToken, isChatParticipant, createMessage);

export default router;