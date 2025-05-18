import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';

export const getSuggestedUsers = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const excludedUsers =
      req.user?.settings.content.notInterested.content || [];

    const users = await User.aggregate([
      { $match: { _id: { $nin: [req.user?._id, ...excludedUsers] } } },
      { $sample: { size: 50 } },
      {
        $project: {
          location: 0,
          settings: 0,
          storyFeed: 0,
        },
      },
    ]);

    const usersData = users.map((user) => protectData(user, 'user', [], true));

    return res.status(200).json({
      status: 'success',
      data: {
        users: usersData,
      },
    });
  }
);
