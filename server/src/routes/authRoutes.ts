import express from 'express';
import { signup } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);

router.get('/verify_email/:token', signup);

export default router;
