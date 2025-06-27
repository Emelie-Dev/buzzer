import express from 'express';
import {
  changePassword,
  deactivateAccount,
  deleteAccount,
  getAccountToken,
  getPasswordToken,
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

router.patch('/password', changePassword);

router.get('/password-token', getPasswordToken);

router.patch(
  '/deactivate/:stage',
  getAccountToken('deactivate'),
  deactivateAccount
);

router.delete('/delete/:stage', getAccountToken('delete'), deleteAccount);

export default router;
