import express from 'express';
import { signup } from '../controllers/authController.ts';

const router = express.Router();

router.post('/signup', signup);

export default router;
