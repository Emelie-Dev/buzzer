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

const upload = multerConfig('contents');

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
              // => Add for cloudinary (production) later

              if (process.env.NODE_ENV !== 'production') {
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
                ? (file as any).secure_url
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
        if (file) await fs.promises.unlink(file.path as fs.PathLike);
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
    const categories = ['general', 'account', 'notifications'];
    const category = req.params.category;
    const body = req.body;

    if (!categories.includes(category)) {
      return next(new CustomError('Invalid request!', 400));
    }

    const { general, content } = req.user?.settings;

    let data;

    // Push Notification -

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
        // => Add for cloudinary (production) later

        if (process.env.NODE_ENV !== 'production')
          await fs.promises.unlink(`src/public/users/${user.photo}`);
      } catch {}
    }

    if (user.reelSounds.length > 0) {
      await Promise.allSettled(
        user.reelSounds.map((sound) =>
          fs.promises.unlink(`src/public/reels/${sound.src}`)
        )
      );
    }

    if (contents.length > 0) {
      await Promise.allSettled(
        contents.map(async (content) => {
          const paths = content.media.map((file) => file.src);

          await Promise.allSettled(
            paths.map((src) => {
              if (process.env.NODE_ENV !== 'production') {
                return fs.promises.unlink(`src/public/contents/${src}`);
              }
              return Promise.resolve();
            })
          );
        })
      );
    }

    if (reels.length > 0) {
      await Promise.allSettled(
        reels.map(({ src }) => {
          if (process.env.NODE_ENV !== 'production') {
            return fs.promises.unlink(`src/public/reels/${src}`);
          }
          return Promise.resolve();
        })
      );
    }

    if (stories.length > 0) {
      await Promise.allSettled(
        stories.map(({ media }) => {
          if (process.env.NODE_ENV !== 'production') {
            return fs.promises.unlink(`src/public/stories/${media.src}`);
          }
          return Promise.resolve();
        })
      );
    }

    if (storySounds.length > 0) {
      await Promise.allSettled(
        storySounds.map((src) => {
          if (process.env.NODE_ENV !== 'production') {
            return fs.promises.unlink(`src/public/stories/${src}`);
          }
          return Promise.resolve();
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
      Notification.deleteMany({ user: user._id }),
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
