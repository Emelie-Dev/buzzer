import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import Follow from '../models/followModel.js';
import Notification from '../models/notificationModel.js';

export const followUser = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError("You can't follow yourself.", 400));
    }

    await Follow.create({
      follower: req.user?._id,
      following: req.params.id,
    });

    const notifications = await Notification.find({
      user: req.params.id,
      type: ['follow'],
    }).sort('-createdAt');

    const batchNotification = await Notification.findOne({
      user: req.params.id,
      type: ['follow', 'batch'],
    });

    const allowNotifications =
      user.settings.content.notifications.interactions.followers;

    if (allowNotifications) {
      if (notifications.length >= 20 && !batchNotification) {
        // Deletes some previous notifications
        const deleteArray = notifications
          .slice(4, notifications.length)
          .map((data) => data._id);

        await Notification.create({
          user: req.params.id,
          type: ['follow'],
          secondUser: req.user?._id,
        });

        await Notification.create({
          user: req.params.id,
          secondUser: notifications[4].secondUser,
          type: ['follow', 'batch'],
          data: {
            batchCount: deleteArray.length - 1,
          },
        });

        await Notification.deleteMany({
          _id: { $in: deleteArray },
        });
      } else if (batchNotification) {
        await Notification.findByIdAndDelete(notifications[4]._id);

        await Notification.create({
          user: req.params.id,
          type: ['follow'],
          secondUser: req.user?._id,
        });

        await Notification.findByIdAndUpdate(
          batchNotification._id,
          {
            secondUser: notifications[4].secondUser,
            $inc: { 'data.batchCount': 1 },
          },
          {
            runValidators: true,
          }
        );
      } else {
        await Notification.create({
          user: req.params.id,
          type: ['follow'],
          secondUser: req.user?._id,
        });
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Followed succesfully.',
    });
  }
);

export const unfollowUser = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const follow = await Follow.findById(req.params.id);

    if (!follow || String(follow.follower) !== String(req.user?._id)) {
      return next(new CustomError('Could not unfollow user.', 404));
    }

    await follow.deleteOne();

    const notification = await Notification.findOne({
      user: follow.following,
      type: ['follow'],
      secondUser: req.user?._id,
    });

    const batchNotification = await Notification.findOne({
      user: follow.following,
      type: ['follow', 'batch'],
    });

    if (notification) await notification.deleteOne();

    if (batchNotification && !notification) {
      await Notification.findByIdAndUpdate(
        batchNotification._id,
        {
          $inc: { 'data.batchCount': -1 },
        },
        {
          runValidators: true,
        }
      );
    }

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);
