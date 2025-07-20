import express from 'express';
import {
  likeItem,
  dislikeItem,
  getUserLikedPosts,
} from '../controllers/likeController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.route('/').get(getUserLikedPosts).post(likeItem);

router.delete('/:collection/:documentId', dislikeItem);

export default router;
