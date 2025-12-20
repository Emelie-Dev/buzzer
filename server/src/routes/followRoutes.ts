import express from 'express';
import {
  followUser,
  getConnections,
  removeFollower,
  unfollowUser,
} from '../controllers/followController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.route('/:id').post(followUser).delete(unfollowUser);

router.get('/followers', getConnections('followers'));
router.get('/following', getConnections('following'));

router.delete('/remove/:id', removeFollower);

export default router;
