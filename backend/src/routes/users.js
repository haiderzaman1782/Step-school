import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/usersController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', upload.single('avatar'), createUser);
router.put('/:id', upload.single('avatar'), updateUser);
router.delete('/:id', deleteUser);

export default router;

