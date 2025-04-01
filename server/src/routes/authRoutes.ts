import express from 'express';
import {
  authConfirmed,
  login,
  logout,
  signup,
  verifyEmail,
} from '../controllers/authController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.get('/verify-email/:token', verifyEmail);
router.get('/auth-check', protectRoute, authConfirmed);

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

export default router;
