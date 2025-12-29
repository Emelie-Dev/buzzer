import asyncErrorHandler, { AuthRequest } from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import CustomError from '../utils/CustomError.js';
import Notification from '../models/notificationModel.js';
import { isValidDateString } from './commentController.js';
import Reel from '../models/reelModel.js';
import Content from '../models/contentModel.js';
import Like from '../models/likeModel.js';

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

export const getNotifications = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    /* Post
    - Like user's post
    - comment on user's post
    - like user's comment
    - comments on user's comment
   

  Mentions (derive mentions from client)
    - user is mentioned in post description or comments

  Followers
    - user is followed

  Requests
    - receieves friend request
    - user's friend request accepted or rejected
     - pending collaboration
    - accepted collaboration

  System
    - notifications about user's device or account

    -- new login
    -- multtiple login
    -- failed login
    -- password change
*/

    const pageSize = 20;
    const cursor = req.query.cursor;
    const cursorDate = isValidDateString(cursor as string)
      ? new Date(String(cursor))
      : new Date();
    let notificationData: any[] = [];

    const notifications = await Notification.aggregate([
      {
        $match: {
          createdAt: { $lt: cursorDate },
          user: req.user?._id,
          $nor: [
            { type: ['collaborate', 'content'] },
            { type: ['collaborate', 'reel'] },
            { type: ['friend_request'] },
          ],
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'follows',
          let: { viewerId: '$user', secondUser: '$secondUser' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', '$$viewerId'] },
                    { $eq: ['$following', '$$secondUser'] },
                  ],
                },
              },
            },
          ],
          as: 'isFollowing',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$secondUser' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                name: 1,
                username: 1,
                photo: 1,
              },
            },
          ],
          as: 'secondUser',
        },
      },

      {
        $addFields: {
          isFollowing: { $first: '$isFollowing' },
          secondUser: { $first: '$secondUser' },
        },
      },
    ]);

    const friendRequest = !!(await Notification.exists({
      user: req.user?._id,
      type: { $eq: ['friend_request'] },
    }));

    const collaborationRequest = !!(await Notification.exists({
      user: req.user?._id,
      $or: [
        { type: ['collaborate', 'content'] },
        { type: ['collaborate', 'reel'] },
      ],
    }));

    if (notifications.length > 0) {
      notificationData = notifications.map(async (obj) => {
        let [action, collection] = obj.type;
        const documentId = obj.data?.postId || obj.documentId;

        if (
          action === 'comment' ||
          action === 'reply' ||
          action === 'mention'
        ) {
          const docId = obj.data?.commentId || obj.documentId;
          const likeObj = await Like.findOne({
            user: req.user?._id,
            collectionName:
              action === 'comment' || action === 'reply'
                ? 'comment'
                : collection,
            documentId: docId,
          });

          obj.likeObj = likeObj;
        }

        const mediaCollection = obj.data?.collection;

        if (collection !== 'reel' && collection !== 'content')
          collection = mediaCollection;

        const query =
          collection === 'reel'
            ? Reel.findById(documentId)
            : collection === 'content'
            ? Content.findById(documentId)
            : null;

        if (query) {
          const data = (await query) as any;

          if (data) {
            const src = collection === 'reel' ? data.src : data.media[0].src;
            const mediaType =
              collection === 'reel' ? 'video' : data.media[0].mediaType;

            obj.post = {
              _id: data._id,
              src,
              type: mediaType,
            };
          }
        }

        return obj;
      });

      notificationData = await Promise.all(notificationData);
    }

    return res.status(200).json({
      status: 'success',
      data: {
        notifications: notificationData,
        friendRequest,
        collaborationRequest,
      },
    });
  }
);

export const deleteNotifications = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { notifications } = req.body;

    if (!notifications)
      return next(new CustomError('No notifications provided!', 400));

    if (notifications.length < 1)
      return next(new CustomError('Notification list cannot be empty!', 400));

    if (notifications.length > 1000)
      return next(new CustomError('Notification list is too large!', 400));

    await Notification.deleteMany({
      user: req.user?._id,
      _id: { $in: notifications },
    });

    return res.status(204).send({ status: 'success', message: null });
  }
);

export const getSecurityAlerts = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const pageSize = 20;
    const cursor = req.query.cursor;
    const cursorDate = isValidDateString(cursor as string)
      ? new Date(String(cursor))
      : new Date();

    const notifications = await Notification.aggregate([
      {
        $match: {
          createdAt: { $lt: cursorDate },
          user: req.user?._id,
          type: 'security',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $limit: pageSize },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        notifications,
      },
    });
  }
);
