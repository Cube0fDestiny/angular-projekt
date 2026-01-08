import express from 'express';
import { getAllPosts, createPost } from '../controllers/postController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllPosts);
router.post('/', verifyToken, createPost); // Tylko zalogowani mogą pisać

export default router;