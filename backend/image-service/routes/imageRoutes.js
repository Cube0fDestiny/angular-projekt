import express from "express";
import multer from "multer";
import {
  uploadImage,
  getImageById,
  deleteImage,
} from "../controllers/imageController.js";
import { attachUserFromHeaders, requireAuth } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(attachUserFromHeaders);

// Musi być pole o nazwie 'image' w formularzu multipar/form-data
router.post("/", requireAuth, upload.single("image"), uploadImage);
router.get("/:id", getImageById);
router.delete("/:id", requireAuth, deleteImage);

export default router;
