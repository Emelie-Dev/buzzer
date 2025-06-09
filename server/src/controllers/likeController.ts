import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import Story from '../models/storyModel.js';
import Like from '../models/likeModel.js';
import Content from '../models/contentModel.js';
import Comment from '../models/commentModel.js';
import Notification from '../models/notificationModel.js';
import Reel from '../models/reelModel.js';

export const likeItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId } = req.body;
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

    const data = (await query) as Record<string, any>;

    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    if (collection === 'story' && String(data.user) === String(req.user?._id)) {
      return next(new CustomError("You can't like your story.", 404));
    }

    await Like.create({
      user: req.user?._id,
      collectionName: collection,
      documentId: data._id,
    });

    // Handle notifications

    // Get like notifications
    const notifications = await Notification.find({
      user: data.user,
      type: ['like', collection],
      documentId: data._id,
    }).sort('-createdAt');

    const batchNotification = await Notification.findOne({
      user: data.user,
      type: ['like', collection, 'batch'],
      documentId: data._id,
    });

    if (notifications.length >= 20 && !batchNotification) {
      await Notification.create({
        user: data.user,
        secondUser: req.user?._id,
        type: ['like', collection, 'batch'],
        documentId: data._id,
        data: {
          batchCount: 15,
        },
      });

      // Deletes some previous notifications
      const deleteArray = notifications
        .slice(5, notifications.length)
        .map((data) => data._id);

      await Notification.deleteMany({
        _id: { $in: deleteArray },
      });
    } else if (batchNotification) {
      await Notification.findByIdAndUpdate(
        batchNotification._id,
        {
          secondUser: req.user?._id,
          $inc: { 'data.batchCount': 1 },
        },
        {
          runValidators: true,
        }
      );
    } else {
      if (String(data.user) !== String(req.user?._id)) {
        await Notification.create({
          user: data.user,
          type: ['like', collection],
          secondUser: req.user?._id,
          documentId: data._id,
        });
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Liked successfully!',
    });
  }
);

export const dislikeItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const like = await Like.findById(req.params.id);

    if (!like || String(like.user) !== String(req.user?._id)) {
      return next(new CustomError('Could not dislike item.', 404));
    }

    await like.deleteOne();

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);
