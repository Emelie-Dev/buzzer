import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  cancelRequest,
  respondToRequest,
  sendRequest,
} from '../controllers/friendController.js';

const router = express.Router();

router.use(protectRoute);

router
  .route('/request/:recipient')
  .post(sendRequest)
  .patch(respondToRequest)
  .delete(cancelRequest);

export default router;
