import express from 'express';
import { getAllPosts, createPost, updatePost, deletePost, getPostById } from '../controllers/postController.js';
import { verifyToken, isPostOwner } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, isPostOwner, updatePost);
router.delete('/:id', verifyToken, isPostOwner, deletePost);

export default router;