import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  deleteWatchHistory,
  getProfileViews,
  getWatchHistory,
  viewItem,
} from '../controllers/viewController.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.post('/', viewItem);

router.get('/profile', getProfileViews);

router.route('/history').post(getWatchHistory).delete(deleteWatchHistory);

export default router;
