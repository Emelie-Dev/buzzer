import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import multerConfig from '../utils/multerConfig.js';
import CustomError from '../utils/CustomError.js';
import { pool } from '../app.js';
import fs from 'fs';
import path from 'path';
import Content from '../models/contentModel.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';
import getUserLocation from '../utils/getUserLocation.js';
// @ts-ignore
import { checkVideoFilesDuration } from '../worker.js';
import { handleMentionNotifications } from '../utils/handleNotifications.js';
import handleCloudinary from '../utils/handleCloudinary.js';
import { ContentAccessibility } from '../models/storyModel.js';

const upload = multerConfig('contents');

const deleteContentFiles = async (files: Express.Multer.File[]) => {
  const paths = files.map((file) => {
    if (process.env.NODE_ENV === 'production')
      return {
        path: file.filename,
        type: file.mimetype.startsWith('video')
          ? 'video'
          : file.mimetype.startsWith('image')
          ? 'image'
          : 'raw',
      };
    else return { path: file.path };
  });

  await Promise.allSettled(
    paths.map(({ path, type }): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (process.env.NODE_ENV === 'production') {
          handleCloudinary('delete', path, type as 'image' | 'video' | 'raw')
            .then(() => resolve())
            .catch((err) => reject(err));
        } else {
          fs.unlink(path as fs.PathLike, (err) => {
            if (err) reject(err);
            resolve();
          });
        }
      });
    })
  );
};

export const validateContentFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const uploader = upload.array('content', 20);

    uploader(req, res, async (error: any) => {
      const files = (req.files as Express.Multer.File[]) || [];

      try {
        if (error) {
          let message = error.isOperational
            ? error.message
            : error.code === 'LIMIT_FILE_SIZE'
            ? 'Each file must not exceed 1GB.'
            : 'File upload failed.';
          throw new CustomError(
            message,
            error.isOperational || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500
          );
        }

        if (files.length === 0)
          throw new CustomError('You must upload at least one file.', 400);

        if (files.length > 20)
          throw new CustomError('You can only upload 20 files at once.', 400);

        // Gets video and image files
        const videoFiles = files.filter((file) =>
          file.mimetype.startsWith('video')
        );

        // Checks if video files duration is valid
        if (process.env.NODE_ENV === 'development') {
          await pool.exec('checkVideoFilesDuration', [videoFiles, 60]);
        } else {
          await checkVideoFilesDuration(videoFiles, 60);
        }

        next();
      } catch (err) {
        await deleteContentFiles(files);
        next(err);
      }
    });
  }
);

export const processContentFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'text/plain');
    res.write(
      JSON.stringify({ status: 'success', message: 'Processing started' })
    );

    const files = req.files as Express.Multer.File[];

    try {
      // Process files
      await pool.exec(
        'processFiles',
        [files, JSON.parse(req.body.filters).value],
        {
          on: function (event) {
            res.write(JSON.stringify(event));
          },
        }
      );

      next();
    } catch {
      await deleteContentFiles(files);

      res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to process files.',
        })
      );
    }
  }
);

export const saveContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];

    try {
      const mentions = JSON.parse(req.body.mentions);
      const settings = JSON.parse(req.body.settings);

      const filters = JSON.parse(req.body.filters).value;
      const fileDescriptions = JSON.parse(req.body.fileDescriptions).value;

      const contentItems = files.map((file, index) => ({
        src:
          process.env.NODE_ENV === 'production'
            ? file.path
            : path.basename(file.path),
        mediaType: file.mimetype.startsWith('video')
          ? 'video'
          : file.mimetype.startsWith('image')
          ? 'image'
          : '',
        description: fileDescriptions[index],
        filter: filters[index],
      }));

      // Get user's location
      const location = await getUserLocation(req.clientIp);

      const content = await Content.create({
        user: req.user?._id,
        media: contentItems,
        aspectRatio: Number(req.body.aspectRatio),
        description: req.body.description,
        collaborators: (() => {
          if (req.body.collaborators) {
            const collaborators = new Set(
              JSON.parse(req.body.collaborators).value
            );
            collaborators.delete(String(req.user?._id));

            return [...collaborators];
          }

          return undefined;
        })(),
        location,
        settings,
      });

      // send mention notifications
      await handleMentionNotifications(
        'create',
        'content',
        mentions,
        req.user?._id,
        content._id,
        settings.accessibility,
        { text: req.body.description }
      );

      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          data: { content },
        })
      );
    } catch {
      await deleteContentFiles(files);

      return res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to create content.',
        })
      );
    }
  }
);

export const deleteContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const mentions = req.body.mentions;
    const content = await Content.findById(req.params.id);

    if (!content || String(req.user?._id) !== String(content.user)) {
      return next(new CustomError('This content does not exist!', 404));
    }

    // Delete user content
    await content.deleteOne();

    // delete mention notifications
    await handleMentionNotifications(
      'delete',
      'content',
      mentions,
      req.user?._id,
      content._id,
      null,
      null
    );

    // Deletes content files
    const paths = content.media.map((file) => ({
      src: file.src,
      type: file.mediaType,
    }));

    try {
      if (process.env.NODE_ENV === 'production') {
        await Promise.allSettled(
          paths.map(({ src, type }) =>
            handleCloudinary(
              'delete',
              `contents/${path.basename(String(src))}`,
              type
            )
          )
        );
      } else {
        await Promise.allSettled(
          paths.map(({ src }) =>
            fs.promises.unlink(`src/public/contents/${src}`)
          )
        );
      }
    } catch {}

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export const excludeContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomError('This user does not exist!', 404));
    }

    if (String(user._id) === String(req.user?._id)) {
      return next(new CustomError("You can't exlude your content.", 400));
    }

    let list: string[] = req.user?.settings.content.notInterested.content || [];
    if (list.length > 0) list = list.map((value: string) => String(value));

    const excludedContents = new Set(list);
    excludedContents.add(req.params.id);

    if (excludedContents.size > 100) {
      excludedContents.delete(list[0]);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.content.notInterested.content': [...excludedContents],
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

export const getContents = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const categories = ['home', 'following', 'friends'];
    const category = String(req.query.category).trim();
    const viewerId = req.user?._id;

    if (!categories.includes(category)) {
      return next(new CustomError('Invalid request!', 400));
    }

    const excludedUsers =
      req.user?.settings.content.notInterested.content || [];
    excludedUsers.push(viewerId);

    let contents;

    switch (category) {
      case 'home':
        contents = await Content.aggregate([
          {
            $match: {
              user: { $nin: excludedUsers },
              'settings.accessibility': {
                $in: [
                  ContentAccessibility.EVERYONE,
                  ContentAccessibility.FRIENDS,
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'views',
              let: { contentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$documentId', '$$contentId'] },
                        { $eq: ['$user', viewerId] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
                { $project: { _id: 1 } },
              ],
              as: 'viewed',
            },
          },
          { $match: { viewed: [] } },
          {
            $lookup: {
              from: 'friends',
              let: { ownerId: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$requester', '$$ownerId'] },
                            { $eq: ['$recipient', viewerId] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$requester', viewerId] },
                            { $eq: ['$recipient', '$$ownerId'] },
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
            $match: {
              $or: [
                { 'settings.accessibility': ContentAccessibility.EVERYONE },
                { isFriend: { $ne: [] } },
              ],
            },
          },
          { $sample: { size: 10 } },
          {
            $lookup: {
              from: 'users',
              let: { userId: '$user' },
              as: 'user',
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$userId'],
                    },
                  },
                },
                {
                  $lookup: {
                    from: 'follows',
                    let: { userId: '$_id' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$following', '$$userId'] },
                              {
                                $eq: ['$follower', viewerId],
                              },
                            ],
                          },
                        },
                      },
                    ],
                    as: 'isFollowing',
                  },
                },
                {
                  $addFields: {
                    isFollowing: { $first: '$isFollowing' },
                  },
                },
                {
                  $project: { username: 1, name: 1, photo: 1, isFollowing: 1 },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { collaborators: '$collaborators' },
              as: 'collaborators',
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ['$_id', '$$collaborators'],
                    },
                  },
                },
                {
                  $lookup: {
                    from: 'follows',
                    let: { userId: '$_id' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$following', '$$userId'] },
                              {
                                $eq: ['$follower', viewerId],
                              },
                            ],
                          },
                        },
                      },
                    ],
                    as: 'isFollowing',
                  },
                },
                {
                  $addFields: {
                    isFollowing: { $first: '$isFollowing' },
                  },
                },
                {
                  $project: { username: 1, name: 1, photo: 1, isFollowing: 1 },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'stories',
              let: { userId: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$user', { $first: '$$userId._id' }] },
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
                              { $eq: ['$user', viewerId] },
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
            $lookup: {
              from: 'comments',
              localField: '_id',
              foreignField: 'documentId',
              as: 'comments',
            },
          },
          {
            $lookup: {
              from: 'shares',
              localField: '_id',
              foreignField: 'documentId',
              as: 'shares',
            },
          },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'documentId',
              as: 'likes',
            },
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'documentId',
              as: 'bookmarks',
            },
          },
          {
            $addFields: {
              user: { $first: '$user' },
              commentsCount: { $size: '$comments' },
              sharesCount: { $size: '$shares' },
              likesCount: { $size: '$likes' },
              bookmarksCount: { $size: '$bookmarks' },
              userLike: {
                $first: {
                  $filter: {
                    input: '$likes',
                    as: 'like',
                    cond: { $eq: ['$$like.user', viewerId] },
                  },
                },
              },
              userBookmark: {
                $first: {
                  $filter: {
                    input: '$bookmarks',
                    as: 'bookmark',
                    cond: { $eq: ['$$bookmark.user', viewerId] },
                  },
                },
              },
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
              comments: '$$REMOVE',
              shares: '$$REMOVE',
              likes: '$$REMOVE',
              bookmarks: '$$REMOVE',
              stories: '$$REMOVE',
              isFriend: '$$REMOVE',
              viewed: '$$REMOVE',
            },
          },
        ]);
        break;

      case 'following':
        contents = await Content.aggregate([
          {
            // Join with the Follow collection to see if the content's user is being followed by current user
            $lookup: {
              from: 'follows',
              let: { contentUser: '$user' }, // field in Content referencing the user who created it
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$following', '$$contentUser'] }, // content.user == follow.following
                        {
                          $eq: ['$follower', req.user?._id],
                        },
                        { $not: { $in: ['$$contentUser', excludedUsers] } }, // Exclude users
                      ],
                    },
                  },
                },
              ],
              as: 'followInfo',
            },
          },
          {
            // Only keep contents from users that current user follows
            $match: {
              followInfo: { $ne: [] },
            },
          },
          {
            $sample: { size: 10 }, // Random sample
          },
          {
            $project: {
              location: 0,
              settings: 0,
              followInfo: 0,
              __v: 0,
            },
          },
        ]);
        break;

      case 'friends':
        contents = await Content.aggregate([
          {
            $lookup: {
              from: 'friends',
              let: { contentUser: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $or: [
                            {
                              $and: [
                                { $eq: ['$requester', '$$contentUser'] },
                                {
                                  $eq: ['$recipient', req.user?._id],
                                },
                              ],
                            },
                            {
                              $and: [
                                {
                                  $eq: ['$requester', req.user?._id],
                                },
                                { $eq: ['$recipient', '$$contentUser'] },
                              ],
                            },
                          ],
                        },
                        { $not: { $in: ['$$contentUser', excludedUsers] } },
                      ],
                    },
                  },
                },
              ],
              as: 'friendInfo',
            },
          },
          {
            $match: {
              friendInfo: { $ne: [] },
            },
          },
          {
            $sample: { size: 10 },
          },
          {
            $project: {
              location: 0,
              settings: 0,
              friendInfo: 0,
              __v: 0,
            },
          },
        ]);
        break;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        posts: contents,
      },
    });
  }
);

export const getContent = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const content = await Content.findById(req.params.id).select(
      '-__v -settings -location'
    );

    // Check content accessibility settings

    if (!content) {
      return next(new CustomError('This content does not exist!', 404));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        content,
      },
    });
  }
);
