import express from "express";
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPostsByUserId,
} from "../controllers/postController.js";

import { toggleReaction } from "../controllers/reactionController.js";

import {
  createComment,
  getCommentsForPosts,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

import {
  verifyToken,
  isPostOwner,
  isCommentOwner,
} from "../middleware/auth.js";

const router = express.Router();

// Posts enpoints
router.get("/", getAllPosts);
router.get("/user",verifyToken ,getPostsByUserId);
router.get("/:id", getPostById);
router.post("/", verifyToken, createPost);
router.put("/:id", verifyToken, isPostOwner, updatePost);
router.delete("/:id", verifyToken, isPostOwner, deletePost);

// Reaction endpoint
router.post("/:id/reactions", verifyToken, toggleReaction);

// Comments endpoints
router.get("/:postId/comments", getCommentsForPosts);
router.post("/:postId/comments", verifyToken, createComment);
router.put("/comments/:commentId", verifyToken, isCommentOwner, updateComment);
router.delete(
  "/comments/:commentId",
  verifyToken,
  isCommentOwner,
  deleteComment
);

export default router;
