import express from 'express';
import { subscribeToPushNotifications } from '../controllers/notificationController .js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router.post('/push/subscribe', subscribeToPushNotifications);

export default router;
