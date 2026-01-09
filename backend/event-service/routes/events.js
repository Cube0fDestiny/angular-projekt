import express from "express";
import { getEvents, createEvent } from "../controllers/eventController.js";
import { verifyToken, isCreatorOrAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getEvents);
router.post("/", verifyToken, createEvent);
// router.put('/:id', verifyToken, isCreatorOrAdmin, eventCtrl.updateEvent);

export default router;
