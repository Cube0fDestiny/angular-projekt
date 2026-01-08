import express from 'express';
import { getAllUsers, getUserProfile, register, login } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.post('/register', register);
router.post('/login', login);

export default router;