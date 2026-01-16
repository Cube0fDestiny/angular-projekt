import express from "express";
import {
  getUserChats,
  createChat,
  getChatMessages,
  createMessage,
} from "../controllers/chatController.js";
import {
  attachUserFromHeaders,
  requireAuth,
  isChatParticipant,
} from "../middleware/auth.js";

const router = express.Router();

router.use(attachUserFromHeaders);

// Pobierz wszystkie czaty zalogowanego użytkownika
router.get("/", requireAuth, getUserChats);

// Stwórz nowy czat (prywatny lub grupowy)
router.post("/", requireAuth, createChat);

// Pobierz wszystkie wiadomości z konkretnego czatu
// Middleware `isChatParticipant` chroni ten endpoint
router.get(
  "/:chatId/messages",
  requireAuth,
  isChatParticipant,
  getChatMessages
);

// Wyślij nową wiadomość do konkretnego czatu
// Middleware `isChatParticipant` chroni ten endpoint
router.post("/:chatId/messages", requireAuth, isChatParticipant, createMessage);

export default router;
