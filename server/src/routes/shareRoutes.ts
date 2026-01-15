import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { shareItem } from '../controllers/shareController.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.post('/', shareItem);

export default router;
