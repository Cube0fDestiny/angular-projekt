import express from "express";
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPostsByUserId,
} from "../controllers/postController.js";

import {
  toggleReaction,
  getMyReactionForPost,
} from "../controllers/reactionController.js";

import {
  createComment,
  getCommentsForPosts,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

import {
  attachUserFromHeaders,
  requireAuth,
  isPostOwner,
  isCommentOwner,
} from "../middleware/auth.js";

const router = express.Router();

router.use(attachUserFromHeaders);

// Posts enpoints
router.get("/", getAllPosts);
router.get("/user", requireAuth, getPostsByUserId);
router.get("/:id", getPostById);
router.post("/", requireAuth, createPost);
router.put("/:id", requireAuth, isPostOwner, updatePost);
router.delete("/:id", requireAuth, isPostOwner, deletePost);

// Reaction endpoint
router.post("/:id/reactions", requireAuth, toggleReaction);
router.get("/:id/reactions", requireAuth, getMyReactionForPost);

// Comments endpoints
router.get("/:postId/comments", getCommentsForPosts);
router.post("/:postId/comments", requireAuth, createComment);
router.put("/comments/:commentId", requireAuth, isCommentOwner, updateComment);
router.delete(
  "/comments/:commentId",
  requireAuth,
  isCommentOwner,
  deleteComment
);

export default router;
