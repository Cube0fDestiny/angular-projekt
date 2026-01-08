// routes/users.js
import express from "express";
import {
  getAllUsers,
  getUserProfile,
  register,
  login,
  updateProfile,
  deleteUser,
} from "../controllers/userController.js";
import { isOwnerOrAdmin, verifyToken } from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
  validate,
} from "../middleware/validation.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserProfile);
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.put("/:id", verifyToken, isOwnerOrAdmin, updateProfile);
router.delete("/:id", verifyToken, isOwnerOrAdmin, deleteUser);

export default router;
