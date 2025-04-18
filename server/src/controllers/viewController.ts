import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Content from '../models/contentModel.js';
import CustomError from '../utils/CustomError.js';
import View from '../models/viewModel.js';

export const viewItem = asyncErrorHandler(
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

    await View.create({
      user: req.user?._id,
      collectionName: collection,
      documentId: data._id,
    });

    return res.status(201).json({
      status: 'success',
      message: null,
    });
  }
);
