import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import Content from '../models/contentModel.js';
import Comment from '../models/commentModel.js';
import Reel from '../models/reelModel.js';
import {
  handleCreateNotifications,
  handleDeleteNotifications,
  handleMentionNotifications,
} from '../utils/handleNotifications.js';
import { ContentAccessibility } from '../models/storyModel.js';
// 08061500665
export const addComment = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId, text, reply, mentions } = req.body;
    collection = collection.toLowerCase();

    const query =
      collection === 'content'
        ? Content.findById(documentId)
        : collection === 'reel'
        ? Reel.findById(documentId)
        : null;

    const data = (await query!.populate('user')) as Record<string, any>;

    // Check if item exists
    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    // Check if content owner enabled commenting
    const disableComments = data.settings.disableComments;
    if (disableComments) {
      return next(
        new CustomError(`Commenting is disabled for this ${collection}.`, 403)
      );
    }

    const comment = await Comment.create({
      user: req.user?._id,
      collectionName: collection,
      documentId: data._id,
      text,
      reply,
    });

    // Handle notifications
    const allowNotifications =
      data.user.settings.content.notifications.interactions.likes;

    if (allowNotifications) {
      // Handle notifications
      if (reply) {
        await handleCreateNotifications(
          'reply',
          req.user?._id,
          { user: { _id: reply.receiver }, _id: reply.commentId },
          collection,
          { text, commentId: comment._id, postId: data._id }
        );
      } else {
        await handleCreateNotifications(
          'comment',
          req.user?._id,
          data,
          collection,
          { text, commentId: comment._id }
        );
      }
    }

    // send mention notifications
    await handleMentionNotifications(
      'create',
      'comment',
      mentions,
      { id: req.user?._id, name: req.user?.username },
      comment._id,
      ContentAccessibility.EVERYONE,
      { text, collection, docId: documentId }
    );

    return res.status(201).json({
      status: 'success',
      message: 'Comment added!',
    });
  }
);

export const deleteComment = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId, mentions, reply } = req.body;
    collection = collection.toLowerCase();

    const comment = await Comment.findById(req.params.id);

    if (!comment || String(comment.user) !== String(req.user?._id)) {
      return next(new CustomError('This comment does not exist.', 404));
    }

    await comment.deleteOne();

    // Handle notifications
    await handleDeleteNotifications(
      comment.reply ? 'reply' : 'comment',
      req.user?._id,
      comment.reply ? reply.commentId : documentId,
      collection,
      { commentId: comment._id }
    );

    // delete mention notifications
    await handleMentionNotifications(
      'delete',
      'comment',
      mentions,
      { id: req.user?._id, name: req.user?.username },
      comment._id,
      null,
      null
    );

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);
