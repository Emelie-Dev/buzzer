import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { viewItem } from '../controllers/viewController.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', viewItem);

export default router;
