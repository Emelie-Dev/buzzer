import rateLimit from 'express-rate-limit';
import { AuthRequest } from './asyncErrorHandler.js';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message:
    'We have received too many request from this IP address. Please try again later.',

  keyGenerator: (req: AuthRequest) => {
    return req.user?._id || req.clientIp || req.ip;
  },
});

export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message:
    'We have received too many request from this IP address. Please try again later.',
});
