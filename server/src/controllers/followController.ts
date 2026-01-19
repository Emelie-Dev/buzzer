import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import Follow from '../models/followModel.js';
import Notification from '../models/notificationModel.js';
import { isValidDateString } from './commentController.js';
import { PipelineStage } from 'mongoose';

export const followUser = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    let { collection, documentId } = req.body;
    if (collection) collection = collection.toLowerCase();

    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError("You can't follow yourself.", 400));
    }

    const follow = await Follow.create({
      follower: req.user?._id,
      following: req.params.id,
      collectionName: collection,
      documentId,
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
      data: {
        follow,
      },
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

export const getConnections = (type: 'followers' | 'following') =>
  asyncErrorHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const { username } = req.params;
      const viewerId = req.user?._id;
      let userId;

      if (username) {
        const user = await User.findOne({ username });

        if (!user) {
          return next(new CustomError('This user does not exist!', 404));
        }

        userId = user._id;
      }

      const { cursor } = req.query;
      const cursorDate = isValidDateString(String(cursor))
        ? new Date(String(cursor))
        : new Date();

      const limit = 20;
      let pipeline: PipelineStage[];

      if (type === 'followers') {
        pipeline = [
          {
            $match: {
              following: username ? userId : viewerId,
              followedAt: { $lt: cursorDate },
            },
          },
          { $sort: { followedAt: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'follower',
              foreignField: '_id',
              pipeline: [
                {
                  $project: {
                    name: 1,
                    username: 1,
                    photo: 1,
                  },
                },
              ],
              as: 'users',
            },
          },
          {
            $addFields: {
              user: {
                $first: '$users',
              },
            },
          },
          {
            $lookup: {
              from: 'follows',
              let: { viewerId: req.user?._id, userId: '$follower' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$follower', '$$viewerId'] },
                        { $eq: ['$following', '$$userId'] },
                      ],
                    },
                  },
                },
              ],
              as: 'follow',
            },
          },
          {
            $lookup: {
              from: 'stories',
              let: { userId: '$follower' },
              pipeline: [
                {
                  $match: {
                    expired: false,
                    $expr: { $eq: ['$user', '$$userId'] },
                  },
                },
                {
                  $lookup: {
                    from: 'views',
                    let: { storyId: '$_id', viewerId },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$collectionName', 'story'] },
                              { $eq: ['$documentId', '$$storyId'] },
                              { $eq: ['$user', '$$viewerId'] },
                            ],
                          },
                        },
                      },
                      { $project: { _id: 1 } },
                    ],
                    as: 'storyView',
                  },
                },
                { $project: { _id: 1, storyView: 1 } },
              ],
              as: 'stories',
            },
          },
          {
            $addFields: {
              follow: { $first: '$follow' },
              hasStory: {
                $gt: [{ $size: '$stories' }, 0],
              },
              hasUnviewedStory: {
                $anyElementTrue: {
                  $map: {
                    input: '$stories',
                    as: 'story',
                    in: { $eq: [{ $size: '$$story.storyView' }, 0] },
                  },
                },
              },
            },
          },
          {
            $project: {
              stories: 0,
              users: 0,
            },
          },
        ];
      } else {
        pipeline = [
          {
            $match: {
              follower: username ? userId : viewerId,
              followedAt: { $lt: cursorDate },
            },
          },
          { $sort: { followedAt: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'following',
              foreignField: '_id',
              pipeline: [
                {
                  $project: {
                    name: 1,
                    username: 1,
                    photo: 1,
                  },
                },
              ],
              as: 'users',
            },
          },
          {
            $addFields: {
              user: {
                $first: '$users',
              },
            },
          },
          {
            $lookup: {
              from: 'stories',
              let: { userId: '$following' },
              pipeline: [
                {
                  $match: {
                    expired: false,
                    $expr: { $eq: ['$user', '$$userId'] },
                  },
                },
                {
                  $lookup: {
                    from: 'views',
                    let: { storyId: '$_id', viewerId },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$collectionName', 'story'] },
                              { $eq: ['$documentId', '$$storyId'] },
                              { $eq: ['$user', '$$viewerId'] },
                            ],
                          },
                        },
                      },
                      { $project: { _id: 1 } },
                    ],
                    as: 'storyView',
                  },
                },
                { $project: { _id: 1, storyView: 1 } },
              ],
              as: 'stories',
            },
          },
          {
            $addFields: {
              follow: { $first: '$follow' },
              hasStory: {
                $gt: [{ $size: '$stories' }, 0],
              },
              hasUnviewedStory: {
                $anyElementTrue: {
                  $map: {
                    input: '$stories',
                    as: 'story',
                    in: { $eq: [{ $size: '$$story.storyView' }, 0] },
                  },
                },
              },
            },
          },
          {
            $project: {
              stories: 0,
              users: 0,
            },
          },
        ];

        if (username) {
          pipeline.splice(5, 0, {
            $lookup: {
              from: 'follows',
              let: { viewerId: req.user?._id, userId: '$following' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$follower', '$$viewerId'] },
                        { $eq: ['$following', '$$userId'] },
                      ],
                    },
                  },
                },
              ],
              as: 'follow',
            },
          });
        }
      }

      const users = await Follow.aggregate(pipeline);

      return res.status(200).json({
        status: 'success',
        data: { users },
      });
    }
  );

export const removeFollower = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const follow = await Follow.findById(req.params.id);

    if (!follow || String(follow.following) !== String(req.user?._id)) {
      return next(new CustomError('Could not remove follower.', 404));
    }

    await follow.deleteOne();

    const notification = await Notification.findOne({
      user: req.user?._id,
      type: ['follow'],
      secondUser: follow.follower,
    });

    const batchNotification = await Notification.findOne({
      user: follow.follower,
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
