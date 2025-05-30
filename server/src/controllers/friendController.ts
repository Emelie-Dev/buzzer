import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import Friend from '../models/friendModel.js';
import Notification from '../models/notificationModel.js';

export const sendRequest = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { recipient } = req.params;

    // Checks if there is a recipient field
    if (!recipient)
      return next(new CustomError('Please provide a recipient.', 400));

    // Checks if the recipient exists
    const recipientExists = await User.exists({
      _id: recipient,
    });

    if (!recipientExists)
      return next(new CustomError('This recipient does not exist!', 404));

    // Checks if user is friend with recipient
    const friendDocExists = await Friend.exists({
      requester: req.user?._id,
      recipient,
    });

    if (friendDocExists)
      return next(
        new CustomError('You are already friends with this user.', 409)
      );

    // Checks if user friends is up to 1000.
    const friendsCount = await Friend.countDocuments({
      requester: req.user?._id,
    });

    if (friendsCount >= 1000) {
      return next(
        new CustomError(
          'You’ve reached the maximum limit of 1000 friends!',
          400
        )
      );
    }

    // Checks is friend request exists
    const request = await Notification.exists({
      user: recipient,
      secondUser: req.user?._id,
      type: ['friend_request'],
    });

    if (request) {
      return next(
        new CustomError(
          'You’ve already sent a friend request to this user.',
          409
        )
      );
    } else {
      // Send recipient notification
      await Notification.create({
        user: recipient,
        secondUser: req.user?._id,
        type: ['friend_request'],
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Friend request sent!',
    });
  }
);

export const cancelRequest = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { recipient } = req.params;

    const request = await Notification.findById(recipient);

    if (request) {
      await Notification.findByIdAndDelete(request._id);
      return res.status(204).json({
        status: 'success',
        message: null,
      });
    } else {
      return next(new CustomError('This request does not exist!', 404));
    }
  }
);

export const respondToRequest = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {}
);
