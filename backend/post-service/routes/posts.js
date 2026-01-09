import express from 'express';
import { getAllPosts, createPost, updatePost, deletePost } from '../controllers/postController.js';
import { verifyToken, isOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllPosts);
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, isOwnerOrAdmin, updatePost);
router.delete('/:id', verifyToken, isOwnerOrAdmin, deletePost);

export default router;