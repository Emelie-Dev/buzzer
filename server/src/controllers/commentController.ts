import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import Content from '../models/contentModel.js';
import Comment from '../models/commentModel.js';

export const addComment = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId, text, reply } = req.body;
    collection = collection.toLowerCase();

    const query =
      collection === 'content' ? Content.findById(documentId) : null;

    const data = (await query) as Record<string, any>;

    // Check if item exists
    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    // Check if content owner enabled commenting
    if (collection === 'content') {
      const disableComments = data.settings.disableComments;

      if (disableComments) {
        return next(
          new CustomError(`Commenting is disabled for this ${collection}.`, 403)
        );
      } else {
        await Comment.create({
          user: req.user?._id,
          collectionName: collection,
          documentId: data._id,
          text,
          reply,
        });
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Comment added!',
    });
  }
);

export const deleteComment = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment || String(comment.user) !== String(req.user?._id)) {
      return next(new CustomError('This comment does not exist.', 404));
    }

    await comment.deleteOne();

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);
