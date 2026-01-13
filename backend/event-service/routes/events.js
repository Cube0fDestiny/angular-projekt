import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleFollowEvent,
  getEventFollowers,
  getUserEvents,
} from "../controllers/eventController.js";
import { verifyToken, isEventOwner } from "../middleware/auth.js";

const router = express.Router();

/* --- Trasy dla Wydarzeń --- */
router.get("/", getAllEvents);
router.get("/user-events", verifyToken, getUserEvents);
router.get("/:id", getEventById);
router.post("/", verifyToken, createEvent);
router.put("/:id", verifyToken, isEventOwner, updateEvent);
router.delete("/:id", verifyToken, isEventOwner, deleteEvent);

/* --- Trasy dla Uczestników/Obserwujących --- */
router.get("/:id/followers", getEventFollowers);
router.post("/:id/follow", verifyToken, toggleFollowEvent);
export default router;
