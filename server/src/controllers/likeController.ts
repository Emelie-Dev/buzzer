import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import Story from '../models/storyModel.js';
import Like from '../models/likeModel.js';
import Content from '../models/contentModel.js';
import Comment from '../models/commentModel.js';
import Reel from '../models/reelModel.js';
import {
  handleCreateNotifications,
  handleDeleteNotifications,
} from '../utils/handleNotifications.js';
import handleProfileDocuments from '../utils/handleProfileDocuments.js';

export const likeItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId, data: dataObj } = req.body;
    collection = collection.toLowerCase();

    const query =
      collection === 'story'
        ? Story.findById(documentId)
        : collection === 'content'
        ? Content.findById(documentId)
        : collection === 'comment'
        ? Comment.findById(documentId)
        : collection === 'reel'
        ? Reel.findById(documentId)
        : null;

    const data = (await query!.populate('user')) as Record<string, any>;

    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    if (
      collection === 'story' &&
      String(data.user._id) === String(req.user?._id)
    ) {
      return next(new CustomError("You can't like your story.", 404));
    }

    const like = await Like.create({
      user: req.user?._id,
      creator: data.user._id,
      collectionName: collection,
      documentId: data._id,
      data: dataObj,
    });

    if (collection !== 'story') {
      // Handle notifications
      const allowNotifications =
        data.user.settings.content.notifications.interactions.likes;

      if (allowNotifications) {
        await handleCreateNotifications(
          'like',
          req.user?._id,
          data,
          collection,
          {
            value: data.user.settings.content.notifications.push,
            subscription: data.user.pushSubscription,
          }
        );
      }
    }

    return res.status(201).json({
      status: 'success',
      data: { like },
    });
  }
);

export const dislikeItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId } = req.params;
    collection = collection.toLowerCase();
    const id = String(req.query.id);

    const like = await Like.findById(id);

    if (!like || String(like.user) !== String(req.user?._id)) {
      return next(new CustomError('Could not remove like.', 404));
    }

    await like.deleteOne();

    if (collection !== 'story') {
      await handleDeleteNotifications(
        'like',
        req.user?._id,
        documentId,
        collection
      );
    }

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export const getUserLikedPosts = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const liked = await handleProfileDocuments(
      req.user?._id,
      'liked',
      req.query
    );

    return res.status(200).json({
      status: 'success',
      data: {
        liked,
      },
    });
  }
);
