import express from "express";
import multer from "multer";
import { uploadImage, getImageById } from "../controllers/imageController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Musi być pole o nazwie 'image' w formularzu multipar/form-data
router.post("/",verifyToken, upload.single("image"), uploadImage);
router.get("/:id", getImageById);

export default router;