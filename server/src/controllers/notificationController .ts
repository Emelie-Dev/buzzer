import asyncErrorHandler, { AuthRequest } from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import CustomError from '../utils/CustomError.js';

export const subscribeToPushNotifications = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const subscription = req.body.subscription;
    const user = req.user!;

    if (!subscription)
      return next(new CustomError('Please provide a subscription.', 400));

    user.pushSubscription = subscription;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Push subscription registered.',
    });
  }
);
