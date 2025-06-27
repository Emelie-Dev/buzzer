import express from 'express';
import {
  authConfirmed,
  checkIfDataExist,
  forgotPassword,
  login,
  logout,
  removeSession,
  resetPassword,
  signup,
  verifyEmail,
} from '../controllers/authController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.get('/verify-email/:token', verifyEmail);
router.get('/check-data/:field/:value', checkIfDataExist);
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.use(protectRoute);

router.get('/auth-check', authConfirmed);
router.post('/logout/:id', logout);
router.patch('/sessions/:id', removeSession);

export default router;
