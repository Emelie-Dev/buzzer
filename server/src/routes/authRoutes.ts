import express from 'express';
import {
  authConfirmed,
  checkIfDataExist,
  forgotPassword,
  getDeviceAccounts,
  getSessions,
  handleOAuth,
  login,
  logout,
  oAuthCallback,
  removeOAuthProvider,
  removeSession,
  resetPassword,
  signup,
  switchAccount,
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
router.post('/:provider', handleOAuth());
router.get('/:provider/callback', oAuthCallback());
router.get('/link-oauth/:provider/callback', oAuthCallback(true));

router.use(protectRoute);

router.get('/auth-check', authConfirmed);
router.post('/logout', logout);
router.get('/sessions', getSessions);
router.delete('/sessions/:id', removeSession);
router.get('/accounts', getDeviceAccounts);
router.post('/switch-account/:id', switchAccount);
router.post('/link-oauth/:provider', handleOAuth(true));
router.post('/remove-oauth/:provider', removeOAuthProvider);

export default router;
