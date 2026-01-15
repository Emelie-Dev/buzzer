import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  getFriends,
  getFriendsSugestions,
  getRequests,
  removeFriend,
  respondToRequest,
  sendRequest,
} from '../controllers/friendController.js';
import { cancelRequest } from '../utils/handleNotifications.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router
  .route('/request/:id')
  .post(sendRequest)
  .delete(cancelRequest('friend_request'));

router.post('/request/respond/:id', respondToRequest);

router.get('/requests', getRequests);

router.get('/suggestions', getFriendsSugestions);

router.get('/', getFriends);

router.delete('/:id', removeFriend);

export default router;
