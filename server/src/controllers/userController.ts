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
import Story, { ContentAccessibility } from '../models/storyModel.js';
import Comment from '../models/commentModel.js';
import Bookmark from '../models/bookmarkModel.js';
import Notification from '../models/notificationModel.js';
import View from '../models/viewModel.js';
import handleCloudinary from '../utils/handleCloudinary.js';
import { isValidDateString } from './commentController.js';
import Share from '../models/shareModel.js';
import Session from '../models/sessionModel.js';
import { DateTime } from 'luxon';

const upload = multerConfig('users');

const updateProfileDetails = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploader = upload.single('photo');

    uploader(req, res, async (error) => {
      const file = req.file as Express.Multer.File;
      const photo = req.user?.photo;
      const removePhoto = req.body.removePhoto === 'true';

      try {
        if (error) {
          let message = error.isOperational
            ? error.message
            : error.code === 'LIMIT_FILE_SIZE'
              ? 'File must not exceed 1GB.'
              : 'File upload failed.';

          throw new CustomError(
            message,
            error.isOperational || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500,
          );
        }

        if (removePhoto || file) {
          // Check if file is an image
          if (file) {
            if (!file.mimetype.startsWith('image'))
              throw new CustomError('You can only upload image files.', 400);
          }

          // Delete previous photo
          if (
            photo !== 'default.jpg' &&
            photo !==
              'https://res.cloudinary.com/dtwsoibt0/image/upload/v1765614386/default.jpg'
          ) {
            try {
              if (process.env.NODE_ENV === 'production') {
                await handleCloudinary(
                  'delete',
                  `users/${path.basename(photo)}`,
                  'image',
                );
              } else {
                await fs.promises.unlink(`src/public/users/${photo}`);
              }
            } catch {}
          }
        }

        if (removePhoto && file) {
          if (process.env.NODE_ENV === 'production') {
            await handleCloudinary('delete', file.filename, 'image');
          } else {
            await fs.promises.unlink(file.path as fs.PathLike);
          }
        }

        const { username, name, email, bio, links, emailVisibility } = req.body;
        const newPhoto = removePhoto
          ? process.env.NODE_ENV === 'production'
            ? 'https://res.cloudinary.com/dtwsoibt0/image/upload/v1765614386/default.jpg'
            : 'default.jpg'
          : file
            ? process.env.NODE_ENV === 'production'
              ? file.path
              : path.basename(file.path)
            : photo;

        const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
            username,
            name,
            email,
            bio,
            links: JSON.parse(links),
            photo: newPhoto,
            'settings.account.emailVisibility':
              emailVisibility === 'true'
                ? true
                : emailVisibility === 'false'
                  ? false
                  : req.user?.settings.account.emailVisibility,
          },
          {
            runValidators: true,
            new: true,
          },
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
    const notInterested =
      req.user?.settings.content.notInterested.content || [];
    const suggestionBlacklist =
      req.user?.settings.general.suggestionBlacklist || [];
    const viewerId = req.user?._id;

    const excludedUsers = [...notInterested, ...suggestionBlacklist];

    const users = await User.aggregate([
      {
        $match: {
          _id: { $nin: [req.user?._id, ...excludedUsers] },
          active: true,
        },
      },
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
          'follows.0': { $exists: false },
        },
      },
      { $sample: { size: 50 } },
      {
        $lookup: {
          from: 'friends',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$requester', '$$userId'] },
                        {
                          $eq: ['$recipient', viewerId],
                        },
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: ['$requester', viewerId],
                        },
                        { $eq: ['$recipient', '$$userId'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'isFriend',
        },
      },
      {
        $addFields: {
          isFriend: { $gt: [{ $size: '$isFriend' }, 0] },
          isAllowed: {
            $or: [
              {
                $eq: ['$settings.general.privacy.value', false],
              },
              {
                $and: [
                  {
                    $eq: ['$settings.general.privacy.value', true],
                  },
                  {
                    $in: [viewerId, '$settings.general.privacy.users'],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'stories',
          let: {
            userId: '$_id',
            isAllowed: '$isAllowed',
            isFriend: '$isFriend',
          },
          pipeline: [
            {
              $match: {
                expired: false,
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$$isAllowed', true] },
                    {
                      $or: [
                        {
                          $eq: [
                            '$accessibility',
                            ContentAccessibility.EVERYONE,
                          ],
                        },
                        {
                          $and: [
                            {
                              $eq: [
                                '$accessibility',
                                ContentAccessibility.FRIENDS,
                              ],
                            },
                            { $eq: ['$$isFriend', true] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'views',
                let: { storyId: '$_id', viewerId: req.user?._id },
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
          name: 1,
          username: 1,
          photo: 1,
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
  },
);

export const removeSuggestedUser = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let id = req.params.id;
    id = String(id).trim();

    const user = await User.findOne({ _id: id, __login: true });

    if (!user) return next(new CustomError('This user does not exist!', 404));

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError('This action is not allowed.', 403));
    }

    const suggestionBlacklist =
      req.user?.settings.general.suggestionBlacklist || [];
    const users = new Set(suggestionBlacklist.map((user: any) => String(user)));

    users.add(id);

    if (users.size > 100) {
      users.delete(String(suggestionBlacklist[0]));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.general.suggestionBlacklist': [...users],
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const userData = protectData(updatedUser!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  },
);

export const getProfileData = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const followers = await Follow.countDocuments({
      following: req.user?._id,
    });

    const following = await Follow.countDocuments({
      follower: req.user?._id,
    });

    const friends = await Friend.countDocuments({
      $or: [
        {
          requester: req.user?._id,
        },
        {
          recipient: req.user?._id,
        },
      ],
    });

    const contents = await Content.countDocuments({
      user: req.user?._id,
    });

    const reels = await Reel.countDocuments({
      user: req.user?._id,
    });

    const likes = await Like.countDocuments({
      creator: req.user?._id,
      collectionName: { $in: ['content', 'reel'] },
    });

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
  },
);

export const getUserData = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const username = req.params.username;
    const viewerId = req.user?._id;
    let isPrivate = false;

    const user = await User.findOne({ username }).select({
      name: 1,
      username: 1,
      photo: 1,
      bio: 1,
      links: 1,
      email: 1,
      'settings.account': 1,
      'settings.general': 1,
    });

    if (!user) {
      return next(new CustomError('This user does not exist', 404));
    }

    if (user.settings.general.privacy.value) {
      const users = user.settings.general.privacy.users.map((id) => String(id));
      if (!users.includes(String(viewerId))) {
        isPrivate = true;
      }
    }

    const followers = await Follow.aggregate([
      {
        $facet: {
          count: [{ $match: { following: user._id } }, { $count: 'value' }],
          followDoc: [
            {
              $match: {
                following: user._id,
                follower: viewerId,
              },
            },
            { $limit: 1 },
          ],
        },
      },
      {
        $project: {
          count: {
            $ifNull: [{ $arrayElemAt: ['$count.value', 0] }, 0],
          },
          follow: { $arrayElemAt: ['$followDoc', 0] },
        },
      },
    ]);

    const following = await Follow.countDocuments({
      follower: user?._id,
    });

    const friends = await Friend.aggregate([
      {
        $facet: {
          count: [
            {
              $match: {
                $or: [
                  {
                    requester: user?._id,
                  },
                  {
                    recipient: user?._id,
                  },
                ],
              },
            },
            { $count: 'value' },
          ],
          friend: [
            {
              $match: {
                $or: [
                  {
                    requester: viewerId,
                    recipient: user._id,
                  },
                  { requester: user._id, recipient: viewerId },
                ],
              },
            },
            { $limit: 1 },
          ],
        },
      },
      {
        $project: {
          count: {
            $ifNull: [{ $arrayElemAt: ['$count.value', 0] }, 0],
          },
          isFriend: { $gt: [{ $size: '$friend' }, 0] },
        },
      },
    ]);

    const posts = await (async () => {
      const [contents, reels] = await Promise.all(
        [Content, Reel].map((model) => {
          if (isPrivate) return 0;

          return model.countDocuments({
            user: user?._id,
            'settings.accessibility': friends[0].isFriend ? { $in: [0, 1] } : 0,
          });
        }),
      );

      return contents + reels;
    })();

    const likes = await Like.aggregate([
      {
        $match: {
          creator: user?._id,
          collectionName: { $in: ['content', 'reel'] },
        },
      },
      {
        $group: {
          _id: {
            documentId: '$documentId',
            collectionName: '$collectionName',
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'likes',
          let: { collection: '$_id.collectionName', docId: '$_id.documentId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$documentId', '$$docId'] },
                    { $eq: ['$collectionName', '$$collection'] },
                    { $eq: ['$user', viewerId] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'viewerLike',
        },
      },
      {
        $addFields: {
          hasLiked: { $gt: [{ $size: '$viewerLike' }, 0] },
        },
      },
      {
        $lookup: {
          from: 'contents',
          as: 'contents',
          let: {
            collection: '$_id.collectionName',
            docId: '$_id.documentId',
          },
          pipeline: [
            {
              $match: {
                'settings.accessibility': friends[0].isFriend
                  ? { $in: [0, 1] }
                  : 0,
                $expr: {
                  $and: [
                    { $eq: ['$$collection', 'content'] },
                    { $eq: ['$$docId', '$_id'] },
                    { $eq: ['$settings.hideEngagements', false] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'reels',
          as: 'reels',
          let: {
            collection: '$_id.collectionName',
            docId: '$_id.documentId',
          },
          pipeline: [
            {
              $match: {
                'settings.accessibility': friends[0].isFriend
                  ? { $in: [0, 1] }
                  : 0,
                $expr: {
                  $and: [
                    { $eq: ['$$collection', 'reel'] },
                    { $eq: ['$$docId', '$_id'] },
                    { $eq: ['$settings.hideEngagements', false] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          post: {
            $cond: [
              { $eq: ['$_id.collectionName', 'reel'] },
              { $first: '$reels' },
              { $first: '$contents' },
            ],
          },
        },
      },
      {
        $match: {
          $or: [{ post: { $exists: true, $ne: null } }, { hasLiked: true }],
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: {
              $cond: [
                { $ne: ['$post', null] },
                '$count',
                {
                  $cond: ['$hasLiked', 1, 0],
                },
              ],
            },
          },
        },
      },
    ]);

    const userData = protectData(user!, 'user', [
      'settings',
      user.settings.account.emailVisibility ? '' : 'email',
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
        profileData: {
          followers: followers[0].count,
          following,
          friends: friends[0].count,
          posts,
          likes: likes[0].count,
        },
        follow: followers[0].follow,
        isAuthUser: String(user._id) === String(viewerId),
        isPrivate: String(user._id) === String(viewerId) ? false : isPrivate,
      },
    });
  },
);

export const getUserPosts = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const allowedTypes = ['all', 'reels', 'private', 'bookmarks', 'liked'];
    const {
      type,
      username,
    }: {
      type?: 'all' | 'reels' | 'private' | 'bookmarks' | 'liked';
      username?: string;
    } = req.params;
    let user;

    if (!allowedTypes.includes(type!.toLowerCase())) {
      return next(new CustomError('Inavlid request!', 400));
    }

    if (username && type !== 'all' && type !== 'reels') {
      return next(new CustomError('You cannot access this data.', 403));
    }

    if (username) {
      user = await User.findOne({ username });

      if (!user) {
        return next(new CustomError('This user does not exist!', 404));
      }
    }

    const posts = await handleProfileDocuments(
      req.user?._id,
      type!,
      req.query,
      user,
    );

    return res.status(200).json({
      status: 'success',
      data: {
        posts,
      },
    });
  },
);

export const getPrivateAudience = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const viewerId = req.user?._id;

    let page: any = req.query.page;
    page = page ? Number(page) : 1;

    const limit = 20;

    let privateAudience: string[] =
      req.user?.settings.general.privacy.users || [];
    const userIds = privateAudience.slice((page - 1) * limit, page * limit);

    const users = await User.aggregate([
      {
        $match: {
          _id: { $in: userIds },
          active: true,
        },
      },
      {
        $lookup: {
          from: 'follows',
          let: { viewerId: req.user?._id, userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', '$$viewerId'] },
                    { $eq: ['$following', '$$userId'] },
                  ],
                },
              },
            },
          ],
          as: 'follow',
        },
      },
      {
        $lookup: {
          from: 'friends',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$requester', '$$userId'] },
                        {
                          $eq: ['$recipient', viewerId],
                        },
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: ['$requester', viewerId],
                        },
                        { $eq: ['$recipient', '$$userId'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'isFriend',
        },
      },
      {
        $addFields: {
          isFriend: { $gt: [{ $size: '$isFriend' }, 0] },
          isAllowed: {
            $or: [
              {
                $eq: ['$settings.general.privacy.value', false],
              },
              {
                $and: [
                  {
                    $eq: ['$settings.general.privacy.value', true],
                  },
                  {
                    $in: [viewerId, '$settings.general.privacy.users'],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'stories',
          let: {
            userId: '$_id',
            isAllowed: '$isAllowed',
            isFriend: '$isFriend',
          },
          pipeline: [
            {
              $match: {
                expired: false,
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$$isAllowed', true] },
                    {
                      $or: [
                        {
                          $eq: [
                            '$accessibility',
                            ContentAccessibility.EVERYONE,
                          ],
                        },
                        {
                          $and: [
                            {
                              $eq: [
                                '$accessibility',
                                ContentAccessibility.FRIENDS,
                              ],
                            },
                            { $eq: ['$$isFriend', true] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'views',
                let: { storyId: '$_id', viewerId: req.user?._id },
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
          name: 1,
          username: 1,
          photo: 1,
          follow: { $first: '$follow' },
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
        },
      },
    ]);

    // remove deleted users
    const existingUserIds = new Set(users.map((user) => String(user._id)));

    const deletedInBatch = userIds.filter(
      (id) => !existingUserIds.has(String(id)),
    );

    if (deletedInBatch.length) {
      privateAudience = privateAudience.filter(
        (id) => !deletedInBatch.includes(String(id)),
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.general.privacy.users': [...privateAudience],
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const userData = protectData(updatedUser!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        users,
        user: userData,
      },
    });
  },
);

export const updatePrivateAudience = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { id, action } = req.body;
    id = String(id).trim();

    const matchObj = action === 'remove' ? { __login: true } : {};

    const user = await User.findOne({ _id: id, ...matchObj });

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
      return next(new CustomError('Your account is not private.', 403));
    }

    let privateAudience = new Set(users);
    if (action === 'add' && privateAudience.has(id)) {
      return next(
        new CustomError('This user is already in your private audience.', 409),
      );
    }

    if (action === 'add') {
      privateAudience = new Set([id, ...users]);

      if (privateAudience.size > 500) {
        return next(
          new CustomError(
            'You’ve reached the maximum number of private audience. Remove someone to add another.',
            400,
          ),
        );
      }
    } else {
      privateAudience.delete(id);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.general.privacy.users': [...privateAudience],
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const userData = protectData(updatedUser!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  },
);

export const updateSettings = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const categories = [
      'general',
      'account',
      'notifications',
      'time-management',
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
            'settings.general.inbox': body.inbox ?? inbox,
            'settings.general.privacy.value': body.privacy ?? privacy.value,
          },
          {
            new: true,
            runValidators: true,
          },
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
          },
        );
        break;

      case 'time-management':
        const { dailyLimit, scrollBreak, sleepReminders } =
          content.timeManagement;

        data = await User.findByIdAndUpdate(
          req.user?._id,
          {
            'settings.content.timeManagement.dailyLimit.enabled':
              body.dailyLimit.enabled ?? dailyLimit.enabled,
            'settings.content.timeManagement.dailyLimit.value':
              body.dailyLimit.value ?? dailyLimit.value,
            'settings.content.timeManagement.scrollBreak.enabled':
              body.scrollBreak.enabled ?? scrollBreak.enabled,
            'settings.content.timeManagement.scrollBreak.value':
              body.scrollBreak.value ?? scrollBreak.value,
            'settings.content.timeManagement.sleepReminders.enabled':
              body.sleepReminders.enabled ?? sleepReminders.enabled,
            'settings.content.timeManagement.sleepReminders.value.startTime':
              body.sleepReminders.value.startTime ??
              sleepReminders.value.startTime,
            'settings.content.timeManagement.sleepReminders.value.endTime':
              body.sleepReminders.value.endTime ?? sleepReminders.value.endTime,
            'settings.content.timeManagement.sleepReminders.value.days':
              body.sleepReminders.value.days ?? sleepReminders.value.days,
          },
          {
            new: true,
            runValidators: true,
          },
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
  },
);

export const getPasswordToken = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Generate verification token
    const verificationToken = String(Math.floor(Math.random() * 1e14)).slice(
      0,
      6,
    );
    const user = req.user!;

    try {
      user.passwordVerificationToken = verificationToken;
      user.passwordVerificationTokenExpires = Date.now() + 60 * 60 * 1000;
      await user.save();

      await new Email(user as IUser, verificationToken).sendSecurityToken(
        'password',
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
          500,
        ),
      );
    }
  },
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
        new CustomError(
          'The verification code is invalid or has expired.',
          400,
        ),
      );
    }

    if (!(await user.comparePasswordInDb(currentPassword, user.password))) {
      return next(new CustomError('Incorrect password.', 401));
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    user.passwordVerificationToken = undefined;
    user.passwordVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    await Session.updateMany(
      { user: user._id, revokedAt: null },
      {
        revokedAt: new Date(),
      },
    );

    // create notification
    await Notification.create({
      user: req.user?._id,
      type: ['security', 'password'],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  },
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

      const verificationToken = String(Math.floor(Math.random() * 1e14)).slice(
        0,
        6,
      );

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
          type,
        );

        return res.status(200).json({
          status: 'success',
          message: 'A verification code has been sent to your email address.',
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
            500,
          ),
        );
      }
    },
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
        new CustomError(
          'The verification code is invalid or has expired.',
          400,
        ),
      );
    }

    user.active = false;
    user.deactivateVerificationToken = undefined;
    user.deactivateVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    await Session.updateMany(
      { user: user._id, revokedAt: null },
      {
        revokedAt: new Date(),
      },
    );

    return res.status(200).json({
      status: 'success',
      message: null,
    });
  },
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
        new CustomError(
          'The verification code is invalid or has expired.',
          400,
        ),
      );
    }

    // Delete reels, reelSounds, contents, stories, comments, likes, account, photo, follows, friends, bookmarks, notifications, views, shares,sessions

    const contents = await Content.find({ user: user._id });
    const reels = await Reel.find({ user: user._id });
    const stories = await Story.find({ user: user._id });
    const storySounds = [
      ...new Set(stories.map((story) => story.sound).filter(Boolean)),
    ];

    await user.deleteOne();

    if (
      user.photo !==
        'https://res.cloudinary.com/dtwsoibt0/image/upload/v1765614386/default.jpg' &&
      user.photo !== 'default.jpg'
    ) {
      try {
        if (process.env.NODE_ENV === 'production') {
          await handleCloudinary(
            'delete',
            `users/${path.basename(user.photo)}`,
            'image',
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
              'raw',
            );
          } else {
            return fs.promises.unlink(`src/public/reels/${sound.src}`);
          }
        }),
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
                  type,
                );
              } else {
                return fs.promises.unlink(`src/public/contents/${src}`);
              }
            }),
          );
        }),
      );
    }

    if (reels.length > 0) {
      await Promise.allSettled(
        reels.map(({ src }) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `reels/${path.basename(String(src))}`,
              'video',
            );
          } else {
            return fs.promises.unlink(`src/public/reels/${src}`);
          }
        }),
      );
    }

    if (stories.length > 0) {
      await Promise.allSettled(
        stories.map(({ media }) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `stories/${path.basename(String(media.src))}`,
              media.mediaType,
            );
          } else {
            return fs.promises.unlink(`src/public/stories/${media.src}`);
          }
        }),
      );
    }

    if (storySounds.length > 0) {
      await Promise.allSettled(
        storySounds.map((src) => {
          if (process.env.NODE_ENV === 'production') {
            return handleCloudinary(
              'delete',
              `stories/${path.basename(String(src))}`,
              'raw',
            );
          } else {
            return fs.promises.unlink(`src/public/stories/${src}`);
          }
        }),
      );
    }

    await Promise.allSettled([
      Session.deleteMany({ user: user._id }),
      Content.deleteMany({ user: user._id }),
      Reel.deleteMany({ user: user._id }),
      Story.deleteMany({ user: user._id }),
      Comment.deleteMany({ user: user._id }),
      Like.deleteMany({ user: user._id }),
      Bookmark.deleteMany({ user: user._id }),
      View.deleteMany({ user: user._id }),
      Share.deleteMany({ user: user._id }),
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
  },
);

export const updateScreenTime = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const value = req.body.value;

    if (!value) {
      return next(new CustomError('The value field is missing!', 400));
    }

    if (typeof value !== 'number') {
      return next(new CustomError('Invalid value type!', 400));
    }

    const summary = req.user?.settings.content.timeManagement.summary;
    const newSummary: Record<string, any> = {};
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayDate = DateTime.fromJSDate(new Date(), {
      zone: timezone,
    }).setZone(req.clientTimeZone!);
    let isNotified = true;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const clientDate = DateTime.fromJSDate(date, {
        zone: timezone,
      }).setZone(req.clientTimeZone!);

      const dateString = clientDate.toISO()!;

      const day = dateString.split('T')[0];
      const data = summary[day] || 0;

      newSummary[day] =
        clientDate.day === todayDate.day
          ? data + parseInt(String(value))
          : data;

      if (clientDate.day === todayDate.day) {
        if (
          newSummary[day] <
          req.user?.settings.content.timeManagement.dailyLimit.value * 60
        ) {
          isNotified = false;
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.content.timeManagement.dailyLimit.notified':
          req.user?.settings.content.timeManagement.dailyLimit.notified &&
          isNotified,
        'settings.content.timeManagement.summary': newSummary,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const userData = protectData(user!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  },
);

export const updateDailyLimitNotification = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayDate = DateTime.fromJSDate(new Date(), {
      zone: timezone,
    }).setZone(req.clientTimeZone!);
    let user;

    const summary = req.user?.settings.content.timeManagement.summary;
    const day = todayDate.toISO()!.split('T')[0];
    const data = summary[day] || 0;

    if (
      data >=
      req.user?.settings.content.timeManagement.dailyLimit.value * 60
    ) {
      user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          'settings.content.timeManagement.dailyLimit.notified': true,
        },
        {
          new: true,
          runValidators: true,
        },
      );
    } else {
      return next(new CustomError('Invalid request!', 400));
    }

    const userData = protectData(user!, 'user');

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  },
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
        post.collaborators.map((id) => String(id)),
      ).add(String(req.user?._id));

      if (collaborators.size > 3) {
        return next(
          new CustomError(
            'This post already has the maximum number of collaborators.',
            400,
          ),
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
  },
);

export const getCollaborationRequests = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const viewerId = req.user?._id;
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
            pipeline: [{ $match: { active: true } }],
          },
        },
        { $unwind: { path: '$requester', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'friends',
            let: { userId: '$requester._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$requester', '$$userId'] },
                          {
                            $eq: ['$recipient', viewerId],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $eq: ['$requester', viewerId],
                          },
                          { $eq: ['$recipient', '$$userId'] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'isFriend',
          },
        },
        {
          $addFields: {
            isFriend: { $gt: [{ $size: '$isFriend' }, 0] },
            isAllowed: {
              $or: [
                {
                  $eq: ['$requester.settings.general.privacy.value', false],
                },
                {
                  $and: [
                    {
                      $eq: ['$requester.settings.general.privacy.value', true],
                    },
                    {
                      $in: [
                        viewerId,
                        '$requester.settings.general.privacy.users',
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: {
              userId: '$requester',
              isAllowed: '$isAllowed',
              isFriend: '$isFriend',
            },
            pipeline: [
              {
                $match: {
                  expired: false,
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId._id'] },
                      { $eq: ['$$isAllowed', true] },
                      {
                        $or: [
                          {
                            $eq: [
                              '$accessibility',
                              ContentAccessibility.EVERYONE,
                            ],
                          },
                          {
                            $and: [
                              {
                                $eq: [
                                  '$accessibility',
                                  ContentAccessibility.FRIENDS,
                                ],
                              },
                              { $eq: ['$$isFriend', true] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
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
                            { $eq: ['$collectionName', 'story'] },
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
            pipeline: [{ $match: { active: true } }],
          },
        },
        { $unwind: { path: '$recipient', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'friends',
            let: { userId: '$recipient._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$requester', '$$userId'] },
                          {
                            $eq: ['$recipient', viewerId],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $eq: ['$requester', viewerId],
                          },
                          { $eq: ['$recipient', '$$userId'] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'isFriend',
          },
        },
        {
          $addFields: {
            isFriend: { $gt: [{ $size: '$isFriend' }, 0] },
            isAllowed: {
              $or: [
                {
                  $eq: ['$recipient.settings.general.privacy.value', false],
                },
                {
                  $and: [
                    {
                      $eq: ['$recipient.settings.general.privacy.value', true],
                    },
                    {
                      $in: [
                        viewerId,
                        '$recipient.settings.general.privacy.users',
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: {
              userId: '$recipient',
              isAllowed: '$isAllowed',
              isFriend: '$isFriend',
            },
            pipeline: [
              {
                $match: {
                  expired: false,
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId._id'] },
                      { $eq: ['$$isAllowed', true] },
                      {
                        $or: [
                          {
                            $eq: [
                              '$accessibility',
                              ContentAccessibility.EVERYONE,
                            ],
                          },
                          {
                            $and: [
                              {
                                $eq: [
                                  '$accessibility',
                                  ContentAccessibility.FRIENDS,
                                ],
                              },
                              { $eq: ['$$isFriend', true] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
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
                            { $eq: ['$collectionName', 'story'] },
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
  },
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
        new CustomError(`You’re not a collaborator on this ${type}.`, 400),
      );
    }
    collaborators.delete(viewerId);

    await post.updateOne({ collaborators: [...collaborators] });

    return res.status(204).json({ status: 'success', message: null });
  },
);
