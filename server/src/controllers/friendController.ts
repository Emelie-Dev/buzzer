import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import Friend from '../models/friendModel.js';
import Notification from '../models/notificationModel.js';
import { isValidDateString } from './commentController.js';

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
    const { id } = req.params;

    // Checks if there is an field
    if (!id) return next(new CustomError('Please provide a request id.', 400));

    // Checks if request exists
    const request = await Notification.exists({
      _id: id,
      secondUser: req.user?._id,
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
          ? 'Friend request accepted successfully.'
          : 'Friend request rejected.',
    });
  }
);

export const getRequests = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { type, page, cursor } = req.query;

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
        { $limit: page === 'true' ? 10 : 20 },
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
        { $limit: page === 'true' ? 10 : 20 },
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
    // Get 20 mutual, 10 following, 10 followers, 10 others

    const excludedUsers: String[] =
      req.user?.settings.content.notInterested.content || [];
    excludedUsers.push(req.user?._id);

    const mutuals = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
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
        $sample: { size: 20 },
      },
      {
        $project: {
          name: 1,
          username: 1,
          photo: 1,
        },
      },
    ]);
    // Add mutual users id to excluded users
    mutuals.forEach((user) => excludedUsers.push(user._id));

    const following = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
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
        $sample: { size: 20 - mutuals.length + 10 },
      },
      {
        $project: {
          name: 1,
          username: 1,
          photo: 1,
        },
      },
    ]);
    // Add following users id to excluded users
    following.forEach((user) => excludedUsers.push(user._id));

    const followers = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
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
        $sample: { size: 30 - following.length + 10 },
      },
      {
        $project: {
          name: 1,
          username: 1,
          photo: 1,
        },
      },
    ]);
    // Add following users id to excluded users
    followers.forEach((user) => excludedUsers.push(user._id));

    const others = await User.aggregate([
      { $match: { _id: { $nin: excludedUsers } } },
      {
        $sample: { size: 40 - followers.length + 10 },
      },
      {
        $project: {
          name: 1,
          username: 1,
          photo: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        users: {
          mutuals,
          following,
          followers,
          others,
        },
      },
    });
  }
);
