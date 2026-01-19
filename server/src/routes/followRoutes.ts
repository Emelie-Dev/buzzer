import express from 'express';
import {
  followUser,
  getConnections,
  removeFollower,
  unfollowUser,
} from '../controllers/followController.js';
import protectRoute from '../middleware/protectRoute.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.route('/:id').post(followUser).delete(unfollowUser);

router.get('/followers/:username?', getConnections('followers'));
router.get('/following/:username?', getConnections('following'));

router.delete('/remove/:id', removeFollower);

export default router;
