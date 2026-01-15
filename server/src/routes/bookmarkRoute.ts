import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  bookmarkItem,
  deleteBookmark,
  getUserBookmarks,
} from '../controllers/bookmarkController.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.route('/').get(getUserBookmarks).post(bookmarkItem);

router.delete('/:id', deleteBookmark);

export default router;
