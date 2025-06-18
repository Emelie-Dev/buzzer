import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';
import Follow from '../models/followModel.js';
import Friend from '../models/friendModel.js';
import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import Like from '../models/likeModel.js';
import CustomError from '../utils/CustomError.js';
import handleProfileDocuments from '../utils/handleProfileDocuments.js';

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
          searchHistory: 0,
          createdAt: 0,
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

export const getProfileData = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const followers = await Follow.find({
      following: req.user?._id,
    }).countDocuments();

    const following = await Follow.find({
      follower: req.user?._id,
    }).countDocuments();

    const friends = await Friend.find({
      $or: [
        {
          requester: req.user?._id,
        },
        {
          recipient: req.user?._id,
        },
      ],
    }).countDocuments();

    const contents = await Content.find({
      user: req.user?._id,
    }).countDocuments();

    const reels = await Reel.find({
      user: req.user?._id,
    }).countDocuments();

    const likes = await Like.find({
      creator: req.user?._id,
      collectionName: { $in: ['content', 'reel'] },
    }).countDocuments();

    return res.status(200).json({
      status: 'success',
      data: {
        followers,
        following,
        friends,
        posts: contents + reels,
        likes,
      },
    });
  }
);

export const getUserPosts = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const allowedTypes = ['all', 'reels', 'private'];
    const {
      type,
    }: {
      type?: 'all' | 'reels' | 'private' | 'bookmarks' | 'liked';
    } = req.params;

    if (!allowedTypes.includes(type!.toLowerCase())) {
      return next(new CustomError('Inavlid request!', 400));
    }

    const posts = await handleProfileDocuments(req.user?._id, type!, req.query);

    return res.status(200).json({
      status: 'success',
      data: {
        posts,
      },
    });
  }
);

export const updatePrivateAudience = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id, action } = req.body;

    const user = await User.findById(id);

    if (!user) return next(new CustomError('This user does not exist!', 404));

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError('This action is not allowed.', 403));
    }

    const { value, users = [] } = req.user?.settings.general.privacy;

    if (action !== 'add' && action !== 'remove') {
      return next(new CustomError('Invalid request!', 400));
    }

    if (!value) {
      return next(new CustomError('This action is not allowed.', 403));
    }

    const privateAudience = new Set(users);

    if (action === 'add') {
      privateAudience.add(id);

      if (privateAudience.size > 1000) {
        const firstItem = [...privateAudience].shift();
        privateAudience.delete(firstItem);
      }
    } else {
      privateAudience.delete(id);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        settings: {
          general: {
            privacy: {
              users: [...privateAudience],
            },
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const userData = protectData(updatedUser!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const updateSettings = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const categories = ['general', 'account'];
    const category = req.params.category;

    if (!categories.includes(category)) {
      return next(new CustomError('Invalid request!', 400));
    }

    const { general } = req.user?.settings;

    let user;

    switch (category) {
      case 'general':
        const { display, inbox, privacy } = general;

        user = await User.findByIdAndUpdate(
          req.user?._id,
          {
            settings: {
              general: {
                display: req.body.display || display,
                inbox: req.body.inbox || inbox,
                'privacy.value': req.body.privacy || privacy.value,
              },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
        break;
    }

    const userData = protectData(user!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);
