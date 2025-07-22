import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Content from '../models/contentModel.js';
import CustomError from '../utils/CustomError.js';
import View from '../models/viewModel.js';
import User from '../models/userModel.js';
import Reel from '../models/reelModel.js';
import Story from '../models/storyModel.js';

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
    const views = await View.aggregate([
      {
        $match: {
          collectionName: 'user',
          documentId: req.user?._id,
        },
      },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'user',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$user._id' },
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
          collectionName: 1,
          documentId: 1,
          createdAt: 1,
          isFollowing: 1,
          user: {
            name: 1,
            username: 1,
            photo: 1,
          },
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
