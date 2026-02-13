import express from 'express';
import {
  getAllCalls,
  getCallById,
  createCall,
  updateCall,
  deleteCall,
} from '../controllers/callsController.js';

const router = express.Router();

router.get('/', getAllCalls);
router.get('/:id', getCallById);
router.post('/', createCall);
router.put('/:id', updateCall);
router.delete('/:id', deleteCall);

export default router;
