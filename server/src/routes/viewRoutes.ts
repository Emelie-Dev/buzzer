import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { getProfileViews, viewItem } from '../controllers/viewController.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', viewItem);

router.get('/profile', getProfileViews);

export default router;
