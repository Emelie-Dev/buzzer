import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { shareItem } from '../controllers/shareController.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', shareItem);

export default router;
