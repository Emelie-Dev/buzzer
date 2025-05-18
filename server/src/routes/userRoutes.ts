import express from 'express';
import { getSuggestedUsers } from '../controllers/userController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.get('/suggested', getSuggestedUsers);

export default router;
