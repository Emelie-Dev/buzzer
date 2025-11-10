import Friend from '../models/friendModel.js';
import Notification from '../models/notificationModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import User from '../models/userModel.js';
import webpush, { PushSubscription } from 'web-push';
import asyncErrorHandler, { AuthRequest } from './asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import CustomError from './CustomError.js';

export const handleCreateNotifications = async (
  type: 'like' | 'comment' | 'reply',
  userId: any,
  data: Record<string, any>,
  collection: string,
  push: { value: Boolean; subscription: PushSubscription },
  obj: Record<string, any> = {}
) => {
  const ownerId = data.user._id;

  if (String(ownerId) !== String(userId)) {
    const notifications = await Notification.find({
      user: ownerId,
      type: [type, collection],
      documentId: data._id,
    }).sort('-createdAt');

    const batchNotification = await Notification.findOne({
      user: ownerId,
      type: [type, collection, 'batch'],
      documentId: data._id,
    });

    if (notifications.length >= 20 && !batchNotification) {
      // Deletes some previous notifications
      const deleteArray = notifications
        .slice(4, notifications.length)
        .map((data) => data._id);

      await Notification.create({
        user: ownerId,
        type: [type, collection],
        secondUser: userId,
        documentId: data._id,
        data: {
          ...obj,
        },
      });

      await Notification.create({
        user: ownerId,
        secondUser: notifications[4].secondUser,
        type: [type, collection, 'batch'],
        documentId: data._id,
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
        user: ownerId,
        type: [type, collection],
        secondUser: userId,
        documentId: data._id,
        data: {
          ...obj,
        },
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
        user: ownerId,
        type: [type, collection],
        secondUser: userId,
        documentId: data._id,
        data: {
          ...obj,
        },
      });
    }

    if (push.value) {
      if (push.subscription) {
        await webpush.sendNotification(
          push.subscription,
          JSON.stringify({
            title: type,
            body: 'Someone liked your post 🎉',
          })
        );
      }
    }
  }
};

export const handleDeleteNotifications = async (
  type: 'like' | 'comment' | 'reply',
  userId: any,
  documentId: string,
  collection: string,
  obj: Record<string, any> = {}
) => {
  let notification;

  if (type === 'comment' || type === 'reply') {
    notification = await Notification.findOne({
      type: [type, collection],
      secondUser: userId,
      documentId,
      'data.commentId': obj.commentId,
    });
  } else {
    notification = await Notification.findOne({
      type: [type, collection],
      secondUser: userId,
      documentId,
    });
  }

  const batchNotification = await Notification.findOne({
    type: [type, collection, 'batch'],
    documentId,
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
};

export const handleMentionNotifications = async (
  action: 'create' | 'delete',
  type: 'content' | 'reel' | 'comment',
  mentions: string[] = [],
  id: string,
  documentId: any,
  accessibility: ContentAccessibility | null,
  data: {} | null
) => {
  if (mentions.length < 1) return;

  try {
    const promises = mentions.map(async (userId: string) => {
      if (userId !== id) {
        const userExists = await User.findOne({ _id: userId });

        if (userExists) {
          const batchNotification = await Notification.findOne({
            user: userExists._id,
            type: { $all: ['mention', 'batch'] },
          });

          if (action === 'create') {
            const allowNotifications =
              userExists.settings.content.notifications.interactions.mentions;

            if (allowNotifications) {
              if (accessibility === ContentAccessibility.YOU) return;

              if (accessibility === ContentAccessibility.FRIENDS) {
                const isFriend = await Friend.findOne({
                  $or: [
                    { requester: id, recipient: userExists._id },
                    { requester: userExists._id, recipient: id },
                  ],
                });

                if (!isFriend) return;
              }

              const notifications = await Notification.find({
                user: userExists._id,
                type: {
                  $in: ['mention'],
                  $not: { $elemMatch: { $eq: 'batch' } },
                },
              }).sort('-createdAt');

              if (notifications.length >= 20 && !batchNotification) {
                // Deletes some previous notifications
                const deleteArray = notifications
                  .slice(4, notifications.length)
                  .map((data) => data._id);

                await Notification.create({
                  user: userExists._id,
                  type: ['mention', type],
                  secondUser: id,
                  documentId,
                  data,
                });

                await Notification.create({
                  user: userExists._id,
                  secondUser: notifications[4].secondUser,
                  type: ['mention', 'batch'],
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
                  user: userExists._id,
                  type: ['mention', type],
                  secondUser: id,
                  documentId,
                  data,
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
                  user: userExists._id,
                  type: ['mention', type],
                  secondUser: id,
                  documentId,
                  data,
                });
              }
            }
          } else {
            const notification = await Notification.findOne({
              user: userExists._id,
              type: ['mention', type],
              secondUser: id,
              documentId,
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
          }
        }
      }
    });

    await Promise.allSettled(promises);
  } catch {}
};

export const sendCollaborationRequests = async (
  collaborators: string[],
  userId: string,
  type: 'reel' | 'content',
  documentId: any
) => {
  const users = collaborators.filter((user) => String(user) !== String(userId));

  if (users.length > 0) {
    await Promise.allSettled(
      users.map(async (user) => {
        const userData = await User.findById(user);

        if (userData) {
          const { value: isPrivate, users: audience } =
            userData.settings.general.privacy;

          if (isPrivate) {
            return !audience.map((user) => String(user)).includes(userId);
          }

          const notificationExists = await Notification.exists({
            user,
            secondUser: userId,
            type: ['collaborate', type],
            documentId,
          });

          if (!notificationExists) {
            await Notification.create({
              user,
              secondUser: userId,
              type: ['collaborate', type],
              documentId,
            });
          }
        }

        return;
      })
    );
  }
};

export const cancelRequest = (type: string) =>
  asyncErrorHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      // Checks if there is an field
      if (!id)
        return next(new CustomError('Please provide a request id.', 400));

      // Checks if request exists
      const request = await Notification.exists({
        _id: id,
        secondUser: req.user?._id,
        type: { $in: [type] },
      });

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
