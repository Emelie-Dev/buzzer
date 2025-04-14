import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { addComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', addComment);

router.delete('/:id', deleteComment);

export default router;
