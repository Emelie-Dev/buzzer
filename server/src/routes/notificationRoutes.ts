import express from 'express';
import {
  deleteNotifications,
  getNotifications,
  getSecurityAlerts,
  subscribeToPushNotifications,
} from '../controllers/notificationController .js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.post('/push/subscribe', subscribeToPushNotifications);

router.route('/').get(getNotifications).delete(deleteNotifications);

router.get('/security', getSecurityAlerts);

export default router;
