import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  cancelRequest,
  getFriendsSugestions,
  getRequests,
  respondToRequest,
  sendRequest,
} from '../controllers/friendController.js';

const router = express.Router();

router.use(protectRoute);

router.route('/request/:id').post(sendRequest).delete(cancelRequest);

router.post('/request/respond/:id', respondToRequest);

router.get('/requests', getRequests);

router.get('/suggestions', getFriendsSugestions);

export default router;
