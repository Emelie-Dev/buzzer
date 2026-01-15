import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  getEngagementStats,
  getFollowersStats,
  getMonthlyEngagementStats,
  getPosts,
  getPostStats,
} from '../controllers/analyticsController.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.get('/engagements', getMonthlyEngagementStats);

router.post('/engagements/:type', getEngagementStats);

router.post('/posts', getPosts);

router.get('/posts/:id', getPostStats);

router.post('/followers', getFollowersStats);

export default router;
