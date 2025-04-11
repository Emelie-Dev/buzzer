import express from 'express';
import { likeItem, dislikeItem } from '../controllers/likeController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', likeItem);

router.delete('/:id', dislikeItem);

export default router;
