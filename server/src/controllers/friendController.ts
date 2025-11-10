import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import Friend from '../models/friendModel.js';
import Notification from '../models/notificationModel.js';
import { isValidDateString } from './commentController.js';
import shuffleData from '../utils/shuffleData.js';
import { PipelineStage } from 'mongoose';

export const sendRequest = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { id: recipient } = req.params;
    recipient = recipient.toLowerCase().trim();

    // Checks if there is a recipient field
    if (!recipient)
      return next(new CustomError('Please provide a recipient.', 400));

    // Check if recipient is the user
    if (recipient === String(req.user?._id)) {
      return next(new CustomError("You can't be friends with yourself.", 400));
    }

    let requestObj;
    // Checks if the recipient exists
    const recipientExists = await User.exists({
      _id: recipient,
    });

    if (!recipientExists)
      return next(new CustomError('This recipient does not exist!', 404));

    // Checks if user is friend with recipient
    const friendDocExists = await Friend.exists({
      $or: [
        {
          requester: req.user?._id,
          recipient,
        },
        { requester: recipient, recipient: req.user?._id },
      ],
    });

    if (friendDocExists)
      return next(
        new CustomError('You are already friends with this user.', 409)
      );

    // Checks if user friends is up to 1000.
    const friendsCount = await Friend.countDocuments({
      $or: [{ requester: req.user?._id }, { recipient: req.user?._id }],
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
      $or: [
        {
          user: recipient,
          secondUser: req.user?._id,
        },
        {
          user: req.user?._id,
          secondUser: recipient,
        },
      ],
      type: { $eq: ['friend_request'] },
    });

    if (request) {
      return next(
        new CustomError(
          'You already have a pending request with this user.',
          409
        )
      );
    } else {
      // Send recipient notification
      requestObj = await Notification.create({
        user: recipient,
        secondUser: req.user?._id,
        type: ['friend_request'],
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Friend request sent!',
      data: {
        request: requestObj,
      },
    });
  }
);

export const respondToRequest = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { action } = req.body;

    // Checks if there is an id field
    if (!id) return next(new CustomError('Please provide a request id.', 400));

    // Checks if request exists
    const request = await Notification.findOne({
      _id: id,
      user: req.user?._id,
    });

    if (!request)
      return next(new CustomError('This request does not exist!', 404));

    // Accept or reject request based on action
    if (action === 'accept') {
      // Checks if user is friend with recipient
      const friendDocExists = await Friend.exists({
        requester: request.secondUser,
        recipient: req.user?._id,
      });

      if (friendDocExists)
        return next(
          new CustomError('You are already friends with this user.', 409)
        );

      // Checks if user friends is up to 1000.
      const friendsCount = await Friend.countDocuments({
        $or: [{ requester: req.user?._id }, { recipient: req.user?._id }],
      });

      if (friendsCount >= 1000) {
        return next(
          new CustomError(
            'You’ve reached the maximum limit of 1000 friends!',
            400
          )
        );
      }

      await Friend.create({
        requester: request.secondUser,
        recipient: req.user?._id,
      });

      await Notification.create({
        user: request.secondUser,
        secondUser: req.user?._id,
        type: ['friend_request', 'accept'],
      });
    } else if (action === 'reject') {
      await Notification.create({
        user: request.secondUser,
        secondUser: req.user?._id,
        type: ['friend_request', 'reject'],
      });
    } else {
      return next(new CustomError('Invalid request body.', 400));
    }

    // Delete friend request
    await request.deleteOne();

    return res.status(200).json({
      status: 'success',
      message:
        action === 'accept'
          ? 'Friend request accepted.'
          : 'Friend request declined.',
    });
  }
);

export const getRequests = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { type, cursor } = req.query;

    const cursorDate = isValidDateString(String(cursor))
      ? new Date(String(cursor))
      : new Date();

    let requests;

    if (type === 'received') {
      requests = await Notification.aggregate([
        {
          $match: {
            user: req.user?._id,
            type: { $eq: ['friend_request'] },
            createdAt: { $lt: cursorDate },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'secondUser',
            as: 'requester',
          },
        },
        { $unwind: '$requester' },
        {
          $lookup: {
            from: 'follows',
            let: { requesterId: '$requester._id' }, // define a variable 'requesterId' = the ID of the requester
            pipeline: [
              // run a subquery using this variable
              {
                $match: {
                  $expr: {
                    // allow use of expressions involving variables
                    $and: [
                      { $eq: ['$follower', req.user?._id] }, // check if the current user is the follower
                      { $eq: ['$following', '$$requesterId'] }, // check if they are following the requester
                    ],
                  },
                },
              },
            ],
            as: 'followInfo',
          },
        },
        {
          $addFields: {
            isFollowing: { $gt: [{ $size: '$followInfo' }, 0] },
          },
        },
        {
          $project: {
            _id: 1,
            requester: {
              _id: 1,
              username: 1,
              photo: 1,
            },
            isFollowing: 1,
            createdAt: 1,
          },
        },
      ]);
    } else if (type === 'sent') {
      requests = await Notification.aggregate([
        {
          $match: {
            secondUser: req.user?._id,
            type: { $eq: ['friend_request'] },
            createdAt: { $lt: cursorDate },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'user',
            as: 'recipient',
          },
        },
        { $unwind: '$recipient' },
        {
          $lookup: {
            from: 'follows',
            let: { recipientId: '$recipient._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$follower', req.user?._id] },
                      { $eq: ['$following', '$$recipientId'] },
                    ],
                  },
                },
              },
            ],
            as: 'followInfo',
          },
        },
        {
          $addFields: {
            isFollowing: { $gt: [{ $size: '$followInfo' }, 0] },
          },
        },
        {
          $project: {
            _id: 1,
            recipient: {
              _id: 1,
              username: 1,
              photo: 1,
            },
            isFollowing: 1,
            createdAt: 1,
          },
        },
      ]);
    } else {
      return next(new CustomError('Invalid request!', 400));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        requests,
      },
    });
  }
);

export const getFriendsSugestions = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    // Get 10 mutual, 10 following, 5 followers, 5 others

    const excludedUsers: String[] =
      req.user?.settings.content.notInterested.content || [];
    excludedUsers.push(req.user?._id);

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'friends',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$requester', '$$userId'] },
                        { $eq: ['$recipient', req.user?._id] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ['$requester', req.user?._id] },
                        { $eq: ['$recipient', '$$userId'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'isFriend',
        },
      },
      {
        $match: {
          $expr: {
            $eq: [{ $size: '$isFriend' }, 0],
          },
        },
      },
      {
        $lookup: {
          from: 'notifications',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                type: { $eq: ['friend_request'] },
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$user', '$$userId'] },
                        { $eq: ['$secondUser', req.user?._id] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ['$user', req.user?._id] },
                        { $eq: ['$secondUser', '$$userId'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'request',
        },
      },
      {
        $match: {
          $expr: {
            $eq: [{ $size: '$request' }, 0],
          },
        },
      },
    ];

    const mutuals = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
      ...pipeline,
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$follower', req.user?._id] },
                        { $eq: ['$following', '$$userId'] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ['$follower', '$$userId'] },
                        { $eq: ['$following', req.user?._id] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'mutualInfo',
        },
      },
      {
        $match: {
          $expr: {
            $eq: [{ $size: '$mutualInfo' }, 2],
          },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    // Add mutual users id to excluded users
    mutuals.forEach((user) => excludedUsers.push(user._id));

    const following = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
      ...pipeline,
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', req.user?._id] },
                    { $eq: ['$following', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'followingInfo',
        },
      },
      {
        $match: {
          followingInfo: { $ne: [] },
        },
      },
      {
        $sample: { size: 10 - mutuals.length + 10 },
      },
    ]);

    // Add following users id to excluded users
    following.forEach((user) => excludedUsers.push(user._id));

    const followers = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
      ...pipeline,
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$following', req.user?._id] },
                    { $eq: ['$follower', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'followerInfo',
        },
      },
      {
        $match: {
          followerInfo: { $ne: [] },
        },
      },
      {
        $sample: { size: 20 - following.length + 5 },
      },
    ]);

    // Add following users id to excluded users
    followers.forEach((user) => excludedUsers.push(user._id));

    const others = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
      ...pipeline,
      {
        $sample: { size: 25 - followers.length + 5 },
      },
    ]);

    const users = [...mutuals, ...following, ...followers, ...others];
    const userIds = users.map((user) => user._id);

    const suggestions = await User.aggregate([
      {
        $match: {
          _id: { $in: userIds },
        },
      },
      {
        $lookup: {
          from: 'stories',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$user', '$$userId'],
                },
              },
            },
            {
              $lookup: {
                from: 'views',
                let: { storyId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$documentId', '$$storyId'] },
                          { $eq: ['$user', req.user?._id] },
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
        $lookup: {
          from: 'contents',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$user', '$$userId'] } },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                media: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'contents',
        },
      },
      {
        $lookup: {
          from: 'reels',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$user', '$$userId'] } },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                src: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'reels',
        },
      },
      {
        $project: {
          name: 1,
          username: 1,
          photo: 1,
          hasStory: {
            $gt: [{ $size: '$stories' }, 0],
          },
          hasUnviewedStory: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$stories',
                    as: 'story',
                    cond: { $eq: [{ $size: '$$story.storyView' }, 0] },
                  },
                },
              },
              0,
            ],
          },
          post: {
            $cond: {
              if: {
                $gt: [
                  { $arrayElemAt: ['$contents.createdAt', 0] },
                  { $arrayElemAt: ['$reels.createdAt', 0] },
                ],
              },
              then: { $arrayElemAt: ['$contents', 0] },
              else: { $arrayElemAt: ['$reels', 0] },
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        users: shuffleData(suggestions),
      },
    });
  }
);
