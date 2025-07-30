import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  addComment,
  deleteComment,
  getComments,
} from '../controllers/commentController.js';

const router = express.Router();

router.use(protectRoute);

router.route('/').get(getComments).post(addComment);

router.delete('/:id', deleteComment);

export default router;
