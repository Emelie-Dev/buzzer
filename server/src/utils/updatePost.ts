import asyncErrorHandler, { AuthRequest } from './asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import CustomError from './CustomError.js';
import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import { Model } from 'mongoose';

export default (type: 'reel' | 'content') =>
  asyncErrorHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const model: Model<any> = type === 'reel' ? Reel : Content;
      const document = await model.findById(req.params.id);

      if (!document || String(document.user) !== String(req.user?._id)) {
        return next(new CustomError(`This ${type} does not exist!`, 404));
      }

      const { playTime = 0, watchedFully = false } = req.body;

      document.playTime += Math.max(Number(playTime) as any, 0);
      document.watchedFully += Math.max(Number(watchedFully) as any, 0);

      await document.save();

      return res.status(201).json({
        status: 'success',
        data: {
          [type]: document,
        },
      });
    }
  );
