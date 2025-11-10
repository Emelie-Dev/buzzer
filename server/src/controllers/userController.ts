import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User, { IUser } from '../models/userModel.js';
import protectData from '../utils/protectData.js';
import Follow from '../models/followModel.js';
import Friend from '../models/friendModel.js';
import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import Like from '../models/likeModel.js';
import CustomError from '../utils/CustomError.js';
import handleProfileDocuments from '../utils/handleProfileDocuments.js';
import multerConfig from '../utils/multerConfig.js';
import fs from 'fs';
import path from 'path';
import Email from '../utils/Email.js';
import Story from '../models/storyModel.js';
import Comment from '../models/commentModel.js';
import Bookmark from '../models/bookmarkModel.js';
import Notification from '../models/notificationModel.js';
import { randomUUID } from 'crypto';
import { manageUserDevices, signToken } from './authController.js';
import View from '../models/viewModel.js';
import handleCloudinary from '../utils/handleCloudinary.js';
import { isValidDateString } from './commentController.js';

const upload = multerConfig('users');

const updateProfileDetails = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploader = upload.single('photo');

    uploader(req, res, async (error) => {
      const file = req.file as Express.Multer.File;
      const photo = req.user?.photo;

      try {
        if (error) {
          let message = error.isOperational
            ? error.message
            : error.code === 'LIMIT_FILE_SIZE'
            ? 'File must not exceed 1GB.'
            : 'File upload failed.';

          throw new CustomError(
            message,
            error.isOperational || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500
          );
        }

        if (file) {
          // Check if file is an image
          if (!file.mimetype.startsWith('image'))
            throw new CustomError('You can only upload image files.', 400);

          // Delete previous photo
          if (photo !== 'default.jpeg') {
            try {
              if (process.env.NODE_ENV === 'production') {
                await handleCloudinary(
                  'delete',
                  `users/${path.basename(photo)}`,
                  'image'
                );
              } else {
                await fs.promises.unlink(`src/public/users/${photo}`);
              }
            } catch {}
          }
        }

        const { username, name, email, bio, links, emailVisibility } = req.body;

        const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
            username,
            name,
            email,
            bio,
            links: JSON.parse(links),
            photo: file
              ? process.env.NODE_ENV === 'production'
                ? file.path
                : path.basename(file.path)
              : photo,
            'settings.account.emailVisibility':
              emailVisibility ?? req.user?.settings.account.emailVisibility,
          },
          {
            runValidators: true,
            new: true,
          }
        );

        resolve(user);
      } catch (err) {
        if (file) {
          if (process.env.NODE_ENV === 'production') {
            await handleCloudinary('delete', file.filename, 'image');
          } else {
            await fs.promises.unlink(file.path as fs.PathLike);
          }
        }
        reject(err);
      }
    });
  });
};

export const getSuggestedUsers = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const excludedUsers =
      req.user?.settings.content.notInterested.content || [];

    const users = await User.aggregate([
      { $match: { _id: { $nin: [req.user?._id, ...excludedUsers] } } },
      {
        $lookup: {
          from: 'follows',
          let: { userId: '$_id', viewerId: req.user?._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$viewerId', '$follower'] },
                    { $eq: ['$$userId', '$following'] },
                  ],
                },
              },
            },
          ],
          as: 'follows',
        },
      },
      {
        $match: {
          follows: [],
        },
      },
      { $sample: { size: 50 } },
      {
        $lookup: {
          from: 'stories',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$$userId', '$user'] } },
            },
            {
              $lookup: {
                from: 'views',
                let: { viewerId: req.user?._id, storyId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$collectionName', 'story'] },
                          { $eq: ['$documentId', '$$storyId'] },
                          { $eq: ['$user', '$$viewerId'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'hasViewed',
              },
            },
            {
              $addFields: { hasViewed: { $gt: [{ $size: '$hasViewed' }, 0] } },
            },
          ],
          as: 'stories',
        },
      },
      {
        $project: {
          name: 1,
          username: 1,
          photo: 1,
          stories: 1,
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

    let { value, users = [] } = req.user?.settings.general.privacy;
    if (users.length > 0) users = users.map((value: string) => String(value));

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
        privateAudience.delete(users[0]);
      }
    } else {
      privateAudience.delete(id);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        'settings.general.privacy.users': [...privateAudience],
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
    const categories = [
      'general',
      'account',
      'notifications',
      'timeManagement',
    ];
    const category = req.params.category;
    const body = req.body;

    if (!categories.includes(category)) {
      return next(new CustomError('Invalid request!', 400));
    }

    const { general, content } = req.user?.settings;

    let data;

    switch (category) {
      case 'general':
        const { display, inbox, privacy } = general;

        data = await User.findByIdAndUpdate(
          req.user?._id,
          {
            'settings.general.display': body.display || display,
            'settings.general.inbox': body.inbox || inbox,
            'settings.general.privacy.value': body.privacy ?? privacy.value,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        break;

      case 'account':
        data = await updateProfileDetails(req, res);
        break;

      case 'notifications':
        const { push, email, interactions = {} } = content.notifications;
        const { likes, comments, followers, mentions, profileViews, messages } =
          interactions;

        data = await User.findByIdAndUpdate(
          req.user?._id,
          {
            'settings.content.notifications.push': body.push ?? push,
            'settings.content.notifications.email': body.email ?? email,
            'settings.content.notifications.interactions.likes':
              body.interactions.likes ?? likes,
            'settings.content.notifications.interactions.comments':
              body.interactions.comments ?? comments,
            'settings.content.notifications.interactions.followers':
              body.interactions.followers ?? followers,
            'settings.content.notifications.interactions.mentions':
              body.interactions.mentions ?? mentions,
            'settings.content.notifications.interactions.profileViews':
              body.interactions.profileViews ?? profileViews,
            'settings.content.notifications.interactions.messages':
              body.interactions.messages ?? messages,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        break;

      case 'timeManagement':
        const { dailyLimit, scrollBreak, sleepReminders } =
          content.timeManagement;

        data = await User.findByIdAndUpdate(
          req.user?._id,
          {
            'settings.content.timeManagement.dailyLimit':
              body.dailyLimit || dailyLimit,
            'settings.content.timeManagement.scrollBreak':
              body.scrollBreak || scrollBreak,
            'settings.content.timeManagement.sleepReminders':
              body.sleepReminders || sleepReminders,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        break;
    }

    if (data instanceof Error) {
      return next(data);
    } else {
      const userData = protectData(data!, 'user');

      return res.status(200).json({
        status: 'success',
        data: {
          user: userData,
        },
      });
    }
  }
);

export const getPasswordToken = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Generate verification token
    const verificationToken = String(Math.floor(Math.random() * 1_000_000));
    const user = req.user!;

    try {
      user.passwordVerificationToken = verificationToken;
      user.passwordVerificationTokenExpires = Date.now() + 60 * 60 * 1000;
      await user.save();

      await new Email(user as IUser, verificationToken).sendSecurityToken(
        'password'
      );

      return res.status(200).json({
        status: 'success',
        message: 'Verification code sent successfully.',
      });
    } catch {
      user.passwordVerificationToken = undefined;
      user.passwordVerificationTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new CustomError(
          'An error occured while sending verification code.',
          500
        )
      );
    }
  }
);

export const changePassword = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { code, currentPassword, newPassword } = req.body;

    const user = await User.findOne({
      passwordVerificationToken: code,
      passwordVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new CustomError('The verification code is invalid or has expired.', 400)
      );
    }

    if (!(await user.comparePasswordInDb(currentPassword, user.password))) {
      return next(new CustomError('Incorrect password.', 401));
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    user.settings.security.sessions = [];
    user.passwordVerificationToken = undefined;
    user.passwordVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // create notification
    await Notification.create({
      user: req.user?._id,
      type: ['security', 'password'],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  }
);

export const getAccountToken = (type: 'delete' | 'deactivate') =>
  asyncErrorHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = req.user!;
      const stage = req.params.stage;
      const password = req.body.password;

      if (stage !== 'token') return next();

      if (!password)
        return next(new CustomError('Please provide your password.', 400));

      if (!(await user.comparePasswordInDb(password, user.password))) {
        return next(new CustomError('Incorrect password.', 401));
      }

      const verificationToken = String(Math.floor(Math.random() * 1_000_000));

      try {
        if (type === 'deactivate') {
          user.deactivateVerificationToken = verificationToken;
          user.deactivateVerificationTokenExpires = Date.now() + 60 * 60 * 1000;
        } else {
          user.deleteVerificationToken = verificationToken;
          user.deleteVerificationTokenExpires = Date.now() + 60 * 60 * 1000;
        }

        await user.save();

        await new Email(user as IUser, verificationToken).sendSecurityToken(
          type
        );

        return res.status(200).json({
          status: 'success',
          message: 'Verification code sent successfully.',
        });
      } catch {
        if (type === 'deactivate') {
          user.deactivateVerificationToken = undefined;
          user.deactivateVerificationTokenExpires = undefined;
        } else {
          user.deleteVerificationToken = undefined;
          user.deleteVerificationTokenExpires = undefined;
        }

        await user.save({ validateBeforeSave: false });

        return next(
          new CustomError(
            'An error occured while sending verification code.',
            500
          )
        );
      }
    }
  );

export const deactivateAccount = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stage = req.params.stage;
    const code = req.body.code;

    if (stage !== 'final')
      return next(new CustomError('Invalid request.', 400));

    if (!code)
      return next(new CustomError('Please provide a verfication code.', 400));

    const user = await User.findOne({
      deactivateVerificationToken: code,
      deactivateVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new CustomError('The verification code is invalid or has expired.', 400)
      );
    }

    user.active = false;
    user.settings.security.sessions = [];
    user.deactivateVerificationToken = undefined;
    user.deactivateVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: 'success',
      message: null,
    });
  }
);

export const deleteAccount = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stage = req.params.stage;
    const code = req.body.code;

    if (stage !== 'final')
      return next(new CustomError('Invalid request.', 400));

    if (!code)
      return next(new CustomError('Please provide a verfication code.', 400));

    const user = await User.findOne({
      deleteVerificationToken: code,
      deleteVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new CustomError('The verification code is invalid or has expired.', 400)
      );
    }

    // Delete reels, reelSounds, contents, stories, comments, likes, account, photo, follows, friends, bookmarks, notifications

    const contents = await Content.find({ user: user._id });
    const reels = await Reel.find({ user: user._id });
    const stories = await Story.find({ user: user._id });
    const storySounds = [
      ...new Set(stories.map((story) => story.sound).filter(Boolean)),
    ];

    await user.deleteOne();

    if (user.photo !== 'default.jpeg') {
      try {
        if (process.env.NODE_ENV === 'production') {
          await handleCloudinary(
            'delete',
            `users/${path.basename(user.photo)}`,
            'image'
          );
        } else {
          await fs.promises.unlink(`src/public/users/${user.photo}`);
        }
      } catch {}
    }

    if (user.reelSounds.length > 0) {
      await Promise.allSettled(
        user.reelSounds.map((sound) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `reels/${path.basename(sound.src)}`,
              'raw'
            );
          } else {
            return fs.promises.unlink(`src/public/reels/${sound.src}`);
          }
        })
      );
    }

    if (contents.length > 0) {
      await Promise.allSettled(
        contents.map(async (content) => {
          const paths = content.media.map((file) => ({
            src: file.src,
            type: file.mediaType,
          }));

          await Promise.allSettled(
            paths.map(({ src, type }) => {
              if (process.env.NODE_ENV === 'production') {
                return handleCloudinary(
                  'delete',
                  `contents/${path.basename(src)}`,
                  type
                );
              } else {
                return fs.promises.unlink(`src/public/contents/${src}`);
              }
            })
          );
        })
      );
    }

    if (reels.length > 0) {
      await Promise.allSettled(
        reels.map(({ src }) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `reels/${path.basename(String(src))}`,
              'video'
            );
          } else {
            return fs.promises.unlink(`src/public/reels/${src}`);
          }
        })
      );
    }

    if (stories.length > 0) {
      await Promise.allSettled(
        stories.map(({ media }) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `stories/${path.basename(String(media.src))}`,
              media.mediaType
            );
          } else {
            return fs.promises.unlink(`src/public/stories/${media.src}`);
          }
        })
      );
    }

    if (storySounds.length > 0) {
      await Promise.allSettled(
        storySounds.map((src) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `stories/${path.basename(String(src))}`,
              'raw'
            );
          } else {
            return fs.promises.unlink(`src/public/stories/${src}`);
          }
        })
      );
    }

    await Promise.allSettled([
      Content.deleteMany({ user: user._id }),
      Reel.deleteMany({ user: user._id }),
      Story.deleteMany({ user: user._id }),
      Comment.deleteMany({ user: user._id }),
      Like.deleteMany({ user: user._id }),
      Bookmark.deleteMany({ user: user._id }),
      Notification.deleteMany({
        $or: [{ user: user._id }, { secondUser: user._id }],
      }),
      Follow.deleteMany({
        $or: [{ follower: user._id }, { following: user._id }],
      }),
      Friend.deleteMany({
        $or: [{ recipient: user._id }, { requester: user._id }],
      }),
    ]);

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export const updateScreenTime = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const value = req.body.value;

    if (!value) {
      return next(new CustomError('The value field is missing!', 400));
    }

    const summary = req.user?.settings.content.timeManagement.summary;
    const newSummary: Record<string, any> = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const day = date.toISOString().split('T')[0];
      const data = summary[day] || 0;

      newSummary[day] =
        date.getDate() === new Date().getDate() ? data + value : data;
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.content.timeManagement.summary': newSummary,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const userData = protectData(user!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const switchAccount = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id, loginDate } = req.body;

    if (!(id || loginDate)) {
      return next(new CustomError('Invalid request!', 400));
    }

    if (id === String(req.user?._id)) {
      return next(
        new CustomError('You are already logged in with this account.', 400)
      );
    }

    const date = new Date(loginDate);
    if (String(date) === 'Invalid Date') {
      return next(new CustomError('Invalid request!', 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    const passwordChangedAt = user.passwordChangedAt;
    if (passwordChangedAt) {
      if (date < passwordChangedAt) {
        return next(
          new CustomError(
            'The password has changed since your last login. Please log in again.',
            401
          )
        );
      }
    }

    const sessions = req.user?.settings.security.sessions || [];
    const currentSession = req.activeSession;

    // deletes current session
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.security.sessions': sessions.filter(
          (device: any) => device.jwi !== currentSession
        ),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Gets JWT ID
    const jwi = randomUUID();

    // Handles logged in devices
    await manageUserDevices(
      user,
      req.get('user-agent')!,
      'email',
      jwi,
      req.clientIp!,
      true
    );

    const userData = protectData(user, 'user');

    res.cookie('jwt', signToken(user._id, jwi), {
      maxAge: Number(process.env.JWT_LOGIN_EXPIRES),
      //  Prevents javascript access
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const getWatchHistory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { cursor, period } = req.body;
    const allowedPeriod = ['1y', '1m', '1w', '1d', 'all'];

    if (!(allowedPeriod.includes(period) || (period.start && period.end))) {
      return next(new CustomError('Invalid request!', 400));
    }

    let startDate = period.start ? new Date(period.start) : new Date();
    const endDate = period.end ? new Date(period.end) : new Date();
    const cursorDate = cursor ? new Date(cursor) : new Date();
    const limit = 20;

    if (
      period instanceof Object &&
      (String(startDate) === 'Invalid Date' ||
        String(endDate) === 'Invalid Date')
    ) {
      return next(new CustomError('Invalid request!', 400));
    }

    if (period === '1d') startDate.setMinutes(0, 0, 0);
    else startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(1);
        break;

      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;

      case '1w':
        startDate.setDate(startDate.getDate() - 7);
        break;

      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;

      case 'all':
        const firstDocument = await View.findOne({
          user: req.user?._id,
          collectionName: { $ne: 'user' },
        }).sort({ createdAt: 1 });
        startDate = firstDocument ? firstDocument.createdAt : new Date();
        break;
    }

    const history = await View.aggregate([
      {
        $match: {
          user: req.user?._id,
          collectionName: { $ne: 'user' },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$documentId',
          createdAt: { $first: '$createdAt' },
          type: { $first: '$collectionName' },
        },
      },
      {
        $match: {
          createdAt: { $lt: cursorDate },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'contents',
          localField: '_id',
          foreignField: '_id',
          as: 'content',
        },
      },
      {
        $lookup: {
          from: 'reels',
          localField: '_id',
          foreignField: '_id',
          as: 'reel',
        },
      },
      {
        $addFields: {
          reel: { $first: '$reel' },
          content: { $first: '$content' },
        },
      },
      {
        $project: {
          createdAt: 1,
          'reel.src': 1,
          'content.media': 1,
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: { history },
    });
  }
);

export const replyCollaborationRequest = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { action } = req.body;

    if (!id) return next(new CustomError('Please provide a request id.', 400));

    const request = await Notification.findById(id);
    if (!request) {
      return next(new CustomError('This request does not exist!', 404));
    }

    const [_, type] = request.type;
    const post =
      type === 'reel'
        ? await Reel.findById(request.documentId)
        : await Content.findById(request.documentId);

    if (!post) {
      return next(new CustomError(`This ${type} does not exist!`, 404));
    }

    if (action === 'accept') {
      const collaborators = new Set(
        post.collaborators.map((id) => String(id))
      ).add(String(req.user?._id));

      if (collaborators.size > 3) {
        return next(
          new CustomError(
            'This post already has the maximum number of collaborators.',
            400
          )
        );
      }

      await post.updateOne({ collaborators: [...collaborators] });

      await Notification.create({
        user: request.secondUser,
        secondUser: req.user?._id,
        documentId: request.documentId,
        type: ['collaborate', type, 'accept'],
      });
    } else if (action === 'reject') {
      await Notification.create({
        user: request.secondUser,
        secondUser: req.user?._id,
        documentId: request.documentId,
        type: ['collaborate', type, 'reject'],
      });
    } else {
      return next(new CustomError('Invalid request body.', 400));
    }

    await request.deleteOne();

    return res.status(200).json({
      status: 'success',
      message:
        action === 'accept'
          ? 'Collaboration request accepted.'
          : 'Collaboration request declined.',
    });
  }
);

export const getCollaborationRequests = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = 20;
    let { type, cursor } = req.query;

    const cursorDate = isValidDateString(String(cursor))
      ? new Date(String(cursor))
      : new Date();

    let requests;

    if (type === 'received') {
      requests = await Notification.aggregate([
        {
          $match: {
            user: req.user?._id,
            $or: [
              { type: ['collaborate', 'content'] },
              { type: ['collaborate', 'reel'] },
            ],
            createdAt: { $lt: cursorDate },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'secondUser',
            as: 'requester',
          },
        },
        { $unwind: '$requester' },
        {
          $lookup: {
            from: 'stories',
            let: { userId: '$requester' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user', '$$userId._id'] },
                },
              },
              {
                $lookup: {
                  from: 'views',
                  let: { storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$documentId', '$$storyId'] },
                            { $eq: ['$user', req.user?._id] },
                          ],
                        },
                      },
                    },
                    { $project: { _id: 1 } },
                  ],
                  as: 'storyView',
                },
              },
              { $project: { _id: 1, storyView: 1 } },
            ],
            as: 'stories',
          },
        },
        {
          $project: {
            hasStory: {
              $gt: [{ $size: '$stories' }, 0],
            },
            hasUnviewedStory: {
              $anyElementTrue: {
                $map: {
                  input: '$stories',
                  as: 'story',
                  in: { $eq: [{ $size: '$$story.storyView' }, 0] },
                },
              },
            },
            requester: {
              _id: 1,
              username: 1,
              photo: 1,
            },
            user: 1,
            secondUser: 1,
            type: 1,
            createdAt: 1,
            data: 1,
            documentId: 1,
          },
        },
      ]);
    } else if (type === 'sent') {
      requests = await Notification.aggregate([
        {
          $match: {
            secondUser: req.user?._id,
            $or: [
              { type: ['collaborate', 'content'] },
              { type: ['collaborate', 'reel'] },
            ],
            createdAt: { $lt: cursorDate },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            foreignField: '_id',
            localField: 'user',
            as: 'recipient',
          },
        },
        { $unwind: '$recipient' },
        {
          $lookup: {
            from: 'stories',
            let: { userId: '$recipient' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user', '$$userId._id'] },
                },
              },
              {
                $lookup: {
                  from: 'views',
                  let: { storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$documentId', '$$storyId'] },
                            { $eq: ['$user', req.user?._id] },
                          ],
                        },
                      },
                    },
                    { $project: { _id: 1 } },
                  ],
                  as: 'storyView',
                },
              },
              { $project: { _id: 1, storyView: 1 } },
            ],
            as: 'stories',
          },
        },
        {
          $project: {
            hasStory: {
              $gt: [{ $size: '$stories' }, 0],
            },
            hasUnviewedStory: {
              $anyElementTrue: {
                $map: {
                  input: '$stories',
                  as: 'story',
                  in: { $eq: [{ $size: '$$story.storyView' }, 0] },
                },
              },
            },
            recipient: {
              _id: 1,
              username: 1,
              photo: 1,
            },
            user: 1,
            secondUser: 1,
            type: 1,
            createdAt: 1,
            data: 1,
            documentId: 1,
          },
        },
      ]);
    } else {
      return next(new CustomError('Invalid request!', 400));
    }

    if (requests.length > 0) {
      requests = requests.map(async (obj) => {
        let [_, collection] = obj.type;

        const query =
          collection === 'reel'
            ? Reel.findById(obj.documentId)
            : collection === 'content'
            ? Content.findById(obj.documentId)
            : null;

        if (query) {
          const data = (await query) as any;

          if (data) {
            const src = collection === 'reel' ? data.src : data.media[0].src;
            const mediaType =
              collection === 'reel' ? 'video' : data.media[0].mediaType;

            obj.post = {
              _id: data._id,
              src,
              type: mediaType,
            };
          }
        }

        return obj;
      });

      requests = await Promise.all(requests);
    }

    return res.status(200).json({
      status: 'success',
      data: {
        requests,
      },
    });
  }
);

export const leaveCollaboration = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { type } = req.body;
    const viewerId = String(req.user?._id);

    if (!id) return next(new CustomError('Please provide a post id.', 400));

    const query =
      type === 'reel'
        ? Reel.findById(id)
        : type === 'content'
        ? Content.findById(id)
        : null;

    if (!query) return next(new CustomError('Invalid request.', 400));

    const post = await query;

    if (!post)
      return next(new CustomError(`This ${type} does not exist!`, 404));

    const collaborators = new Set(post.collaborators.map((id) => String(id)));

    if (!collaborators.has(viewerId)) {
      return next(
        new CustomError(`You’re not a collaborator on this ${type}.`, 400)
      );
    }
    collaborators.delete(viewerId);

    await post.updateOne({ collaborators: [...collaborators] });

    return res.status(204).json({ status: 'success', message: null });
  }
);
