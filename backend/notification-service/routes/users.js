// routes/users.js
import express from "express";
import {
  isOwnerOrAdmin,
  attachUserFromHeaders,
  requireAuth,
} from "../middleware/auth.js";


const router = express.Router();

router.use(attachUserFromHeaders);

export default router;
