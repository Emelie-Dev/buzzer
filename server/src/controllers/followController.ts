import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import Follow from '../models/followModel.js';

export const followUser = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError("You can't follow yourself.", 400));
    }

    await Follow.create({
      follower: req.user?._id,
      following: req.params.id,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Followed succesfully.',
    });
  }
);

export const unfollowUser = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const follow = await Follow.findById(req.params.id);

    if (!follow || String(follow.follower) !== String(req.user?._id)) {
      return next(new CustomError('Could not unfollow user.', 404));
    }

    await follow.deleteOne();

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);
