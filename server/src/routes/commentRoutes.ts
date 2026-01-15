import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  addComment,
  deleteComment,
  getComments,
} from '../controllers/commentController.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.post('/', getComments);

router.post('/add', addComment);

router.delete('/:id', deleteComment);

export default router;
