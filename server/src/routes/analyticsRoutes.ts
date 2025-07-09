import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  getEngagementStats,
  getMonthlyEngagementStats,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(protectRoute);

router.get('/engagements', getMonthlyEngagementStats);

router.get('/engagements/:type', getEngagementStats);

export default router;
