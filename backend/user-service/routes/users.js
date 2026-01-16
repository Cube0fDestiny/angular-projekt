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
  toggleFollow,
  getUserFollowers,
  getUserFollowing,
  requestFriend,
  checkRequests,
  acceptFriendRequest,
  deleteFriendRequest,
  removeFriend,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "../controllers/friendController.js";
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

// Follow endpoints
router.post("/:id/follow", requireAuth, toggleFollow);
router.get("/:id/followers", requireAuth, getUserFollowers);
router.get("/:id/following", requireAuth, getUserFollowing);

// Friend request endpoints
router.post("/:id/friend-request", requireAuth, requestFriend);
router.post("/friend-requests/:id/accept", requireAuth, acceptFriendRequest);
router.delete("/friend-requests/:id", requireAuth, deleteFriendRequest);

// User management endpoints
router.get("/", getAllUsers);
router.get("/:id", getUserProfile);
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.put("/:id", requireAuth, isOwnerOrAdmin, updateProfile);
router.delete("/:id", requireAuth, isOwnerOrAdmin, deleteUser);

// Friends management endpoints
router.get("/friends/list", requireAuth, listFriends);
router.delete("/friends/:id", requireAuth, removeFriend);
router.get("/friend-requests/incoming", requireAuth, listIncomingRequests);
router.get("/friend-requests/outgoing", requireAuth, listOutgoingRequests);
router.get("/friend-requests/pending", requireAuth, checkRequests);

export default router;
