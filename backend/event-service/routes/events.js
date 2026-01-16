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
import {
  attachUserFromHeaders,
  requireAuth,
  isEventOwner,
} from "../middleware/auth.js";

const router = express.Router();

router.use(attachUserFromHeaders);

/* --- Trasy dla Wydarzeń --- */
router.get("/", getAllEvents);
router.get("/user-events", requireAuth, getUserEvents);
router.get("/:id", getEventById);
router.post("/", requireAuth, createEvent);
router.put("/:id", requireAuth, isEventOwner, updateEvent);
router.delete("/:id", requireAuth, isEventOwner, deleteEvent);

/* --- Trasy dla Uczestników/Obserwujących --- */
router.get("/:id/followers", getEventFollowers);
router.post("/:id/follow", requireAuth, toggleFollowEvent);
export default router;
