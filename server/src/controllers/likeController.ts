import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import Story from '../models/storyModel.js';
import Like from '../models/likeModel.js';

export const likeItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId } = req.body;
    collection = collection.toLowerCase();

    const query = collection === 'story' ? Story.findById(documentId) : null;
    const data = (await query) as Record<string, any>;

    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    if (String(data.user) === String(req.user?._id)) {
      return next(new CustomError(`You can't like your ${collection}.`, 404));
    }

    await Like.create({
      user: req.user?._id,
      collectionName: collection,
      documentId: data._id,
    });

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
