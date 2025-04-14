import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Content from '../models/contentModel.js';
import CustomError from '../utils/CustomError.js';
import Bookmark from '../models/bookmarkModel.js';

export const bookmarkItem = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId } = req.body;
    collection = collection.toLowerCase();

    const query =
      collection === 'content' ? Content.findById(documentId) : null;

    const data = (await query) as Record<string, any>;

    // Check if item exists
    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    await Bookmark.create({
      user: req.user?._id,
      collectionName: collection,
      documentId: data._id,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Saved successfully!',
    });
  }
);

export const deleteBookmark = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark || String(bookmark.user) !== String(req.user?._id)) {
      return next(new CustomError('Cannot delete bookmark.', 404));
    }

    await bookmark.deleteOne();

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);
