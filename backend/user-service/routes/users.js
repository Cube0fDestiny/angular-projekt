// routes/users.js
import express from 'express';
import { 
  getAllUsers, 
  getUserProfile, 
  register, 
  login, 
  updateProfile, 
  deleteUser 
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.post('/register', register);
router.post('/login', login);
router.put('/:id', updateProfile);
router.delete('/:id', deleteUser);

export default router;