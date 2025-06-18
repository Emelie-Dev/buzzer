import express from 'express';
import {
  getProfileData,
  getSuggestedUsers,
  getUserPosts,
  updatePrivateAudience,
  updateSettings,
} from '../controllers/userController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.get('/suggested', getSuggestedUsers);

router.get('/profile', getProfileData);

router.get('/posts/:type', getUserPosts);

router.patch('/private-audience', updatePrivateAudience);

router.patch('/settings/:category', updateSettings);

export default router;
