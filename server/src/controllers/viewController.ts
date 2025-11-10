import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Content from '../models/contentModel.js';
import CustomError from '../utils/CustomError.js';
import View from '../models/viewModel.js';
import User from '../models/userModel.js';
import Reel from '../models/reelModel.js';
import Story from '../models/storyModel.js';
import { isValidDateString } from './commentController.js';

export const viewItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId } = req.body;
    collection = collection.toLowerCase();
    documentId = documentId.toLowerCase();

    const query =
      collection === 'story'
        ? Story.findById(documentId)
        : collection === 'content'
        ? Content.findById(documentId)
        : collection === 'user'
        ? User.findById(documentId)
        : collection === 'reel'
        ? Reel.findById(documentId)
        : null;

    const data = (await query) as Record<string, any>;

    // Check if item exists
    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    if (collection === 'user') {
      const view = await View.findOne({
        user: req.user?._id,
        collectionName: 'user',
        documentId: data._id,
      });

      const allowNotifications =
        data.settings.content.notifications.interactions.profileViews;

      if (view || String(req.user?._id) === documentId || !allowNotifications) {
        return res.status(200).json({
          status: 'success',
          message: null,
        });
      }
    } else if (collection === 'story') {
      const view = await View.findOne({
        user: req.user?._id,
        collectionName: 'story',
        documentId: data._id,
      });

      if (view || String(req.user?._id) === String(data.user)) {
        return res.status(200).json({
          status: 'success',
          message: null,
        });
      }
    }

    await View.create({
      user: req.user?._id,
      creator: collection === 'user' ? data._id : data.user,
      collectionName: collection,
      documentId: data._id,
    });

    return res.status(201).json({
      status: 'success',
      message: null,
    });
  }
);

export const getProfileViews = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let { count, createdAt } = req.query as any;

    count = Number(count) || Infinity;
    createdAt = isValidDateString(createdAt) ? new Date(createdAt) : new Date();

    const views = await View.aggregate([
      {
        $match: {
          collectionName: 'user',
          documentId: req.user?._id,
        },
      },
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$user', viewerId: req.user?._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$following', '$$userId'],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                followers: { $push: '$$ROOT' },
              },
            },
            {
              $project: {
                _id: 0,
                count: { $ifNull: ['$count', 0] },
                isFollowing: {
                  $first: {
                    $filter: {
                      input: '$followers',
                      as: 'f',
                      cond: {
                        $eq: ['$$f.follower', '$$viewerId'],
                      },
                    },
                  },
                },
              },
            },
          ],
          as: 'followInfo',
        },
      },
      {
        $addFields: {
          followersCount: {
            $cond: [
              { $eq: [{ $size: { $ifNull: ['$followInfo', []] } }, 0] },
              0,
              { $arrayElemAt: ['$followInfo.count', 0] },
            ],
          },
          isFollowing: {
            $cond: [
              { $eq: [{ $size: { $ifNull: ['$followInfo', []] } }, 0] },
              null,
              { $arrayElemAt: ['$followInfo.isFollowing', 0] },
            ],
          },
        },
      },
      {
        $match: {
          followersCount: { $lte: count },
          createdAt: { $lt: createdAt },
        },
      },
      {
        $sort: {
          followersCount: -1,
          createdAt: -1,
        },
      },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          as: 'users',
          foreignField: '_id',
          localField: 'user',
        },
      },
      { $addFields: { user: { $first: '$users' } } },
      {
        $project: {
          user: {
            _id: '$user._id',
            name: '$user.name',
            username: '$user.username',
            photo: '$user.photo',
          },
          followersCount: 1,
          isFollowing: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        views,
      },
    });
  }
);
