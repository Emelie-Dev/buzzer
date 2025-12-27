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
  updateScreenTime,
  updateSettings,
  getWatchHistory,
  replyCollaborationRequest,
  getCollaborationRequests,
  leaveCollaboration,
  getPrivateAudience,
  removeSuggestedUser,
} from '../controllers/userController.js';
import protectRoute from '../middleware/protectRoute.js';
import { cancelRequest } from '../utils/handleNotifications.js';

const router = express.Router();

router.use(protectRoute);

router.get('/suggested', getSuggestedUsers);
router.patch('/suggested/:id', removeSuggestedUser);

router.get('/profile', getProfileData);

router.get('/posts/:type', getUserPosts);

router
  .route('/private-audience')
  .get(getPrivateAudience)
  .patch(updatePrivateAudience);

router.patch('/settings/:category', updateSettings);

router.patch('/password', changePassword);

router.get('/password-token', getPasswordToken);

router.patch(
  '/deactivate/:stage',
  getAccountToken('deactivate'),
  deactivateAccount
);

router.patch('/delete/:stage', getAccountToken('delete'), deleteAccount);

router.patch('/screen-time', updateScreenTime);

router.post('/watch-history', getWatchHistory);

router.get('/collaborate', getCollaborationRequests);

router.post('/collaborate/respond/:id', replyCollaborationRequest);

router.delete('/collaborate/:id', cancelRequest('collaborate'));

router.patch('/collaborate/leave/:id', leaveCollaboration);

export default router;
