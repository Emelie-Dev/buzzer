import express from 'express';
import { followUser, unfollowUser } from '../controllers/followController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.route('/:id').post(followUser).delete(unfollowUser);

export default router;
