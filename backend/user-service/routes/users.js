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
import {
  isOwnerOrAdmin,
  attachUserFromHeaders,
  requireAuth,
} from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
  validate,
} from "../middleware/validation.js";

const router = express.Router();

router.use(attachUserFromHeaders);

router.get("/", getAllUsers);
router.get("/:id", getUserProfile);
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.put("/:id", requireAuth, isOwnerOrAdmin, updateProfile);
router.delete("/:id", requireAuth, isOwnerOrAdmin, deleteUser);

export default router;
