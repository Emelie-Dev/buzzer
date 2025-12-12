import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import nlp from 'compromise';
import Reel from '../models/reelModel.js';
import multerConfig from '../utils/multerConfig.js';
import CustomError from '../utils/CustomError.js';
import { pool } from '../app.js';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { checkVideoFilesDuration, transformReelFiles } from '../worker.js';
import CustomEvent from '../utils/CustomEvent.js';
import getUserLocation from '../utils/getUserLocation.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';
import {
  handleMentionNotifications,
  sendCollaborationRequests,
} from '../utils/handleNotifications.js';
import handleCloudinary from '../utils/handleCloudinary.js';
import { ContentAccessibility } from '../models/storyModel.js';
import { Types } from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'crypto';

const upload = multerConfig('reels');

export const reelEmitter = new CustomEvent();

const deleteReelFiles = async (
  files: {
    [fieldname: string]: Express.Multer.File[];
  },
  excluded?: string[]
) => {
  const paths = Object.entries(files).reduce((accumulator, field) => {
    if (!excluded?.includes(field[0]))
      accumulator.push(
        ...field[1].map((data) => {
          if (process.env.NODE_ENV === 'production')
            return {
              path: data.filename,
              type: data.mimetype.startsWith('video')
                ? 'video'
                : data.mimetype.startsWith('image')
                ? 'image'
                : 'raw',
            };
          else return { path: data.path };
        })
      );
    return accumulator;
  }, [] as { path: string; type?: string }[]);

  await Promise.allSettled(
    paths.map(({ path, type }) => {
      if (process.env.NODE_ENV === 'production') {
        return handleCloudinary(
          'delete',
          String(path),
          (type as 'image' | 'video' | 'raw')!
        );
      } else {
        return fs.promises.unlink(path as fs.PathLike);
      }
    })
  );
};

export const getReels = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const viewerId = req.user?._id;

    const excluded = req.user?.settings.content.notInterested.reels || [];

    const reels = await Reel.aggregate([
      {
        $match: {
          user: { $ne: viewerId },
          'settings.accessibility': {
            $in: [ContentAccessibility.EVERYONE, ContentAccessibility.FRIENDS],
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
      {
        $addFields: {
          similarity: {
            $let: {
              vars: {
                intersection: {
                  $setIntersection: ['$keywords', excluded],
                },
                union: {
                  $setUnion: ['$keywords', excluded],
                },
              },
              in: {
                $cond: [
                  { $eq: [{ $size: '$$union' }, 0] }, // prevent divide-by-zero
                  0,
                  {
                    $divide: [
                      { $size: '$$intersection' },
                      { $size: '$$union' },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $match: { similarity: { $lte: 0.3 } } },
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
          isCollaborator: {
            $in: [
              viewerId,
              {
                $map: {
                  input: '$collaborators',
                  as: 'user',
                  in: '$$user._id',
                },
              },
            ],
          },
          comments: '$$REMOVE',
          shares: '$$REMOVE',
          likes: '$$REMOVE',
          bookmarks: '$$REMOVE',
          stories: '$$REMOVE',
          isFriend: '$$REMOVE',
          viewed: '$$REMOVE',
          following: '$$REMOVE',
          similarity: '$$REMOVE',
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        posts: reels,
      },
    });
  }
);

export const validateReelFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const uploader = upload.fields([
      { name: 'reel', maxCount: 1 },
      { name: 'sound', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]);

    uploader(req, res, async (error: any) => {
      res.setHeader('Content-Type', 'text/plain');
      res.write(
        JSON.stringify({ status: 'success', message: 'validating' }) + '\n'
      );

      const collaborators = JSON.parse(req.body.collaborators) || [];
      let files =
        (req.files as {
          [fieldname: string]: Express.Multer.File[];
        }) || {};
      files = {
        reel: files.reel || [],
        sound: files.sound || [],
        cover: files.cover || [],
      };

      try {
        if (collaborators.length > 3) {
          throw new CustomError(
            'You can only have up to 3 collaborators per post.',
            400
          );
        }

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

        const reelFiles = files.reel;
        if (reelFiles.length === 0)
          throw new CustomError('Please select a file to upload.', 400);

        // Check if file is a video
        if (!reelFiles[0].mimetype.startsWith('video'))
          throw new CustomError('You can only upload video files.', 400);

        // Checks if video files duration is valid
        await pool.exec('checkVideoFilesDuration', [reelFiles, 3600]);

        next();
      } catch (err: any) {
        await deleteReelFiles(files);
        res.status(err.statusCode || 500).end(
          JSON.stringify({
            status: 'fail',
            message: err.isOperational
              ? err.message
              : 'Error occured while validating file. Please try again.',
          }) + '\n'
        );
      }
    });
  }
);

export const processReelFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.write(
      JSON.stringify({ status: 'success', message: 'processing' }) + '\n'
    );

    let files =
      (req.files as {
        [fieldname: string]: Express.Multer.File[];
      }) || {};
    files = {
      reel: files.reel || [],
      sound: files.sound || [],
      cover: files.cover || [],
    };

    const savedSound = req.body.savedSound;
    let savedSoundError = false;

    try {
      if (savedSound && files.sound.length < 1) {
        const fileExists = fs.existsSync(`src/public/reels/${savedSound}`);

        if (!fileExists) {
          savedSoundError = true;
          throw new Error();
        }
      }

      // Process files
      await pool.exec(
        'transformReelFiles',
        [
          files,
          req.body.position ? JSON.parse(req.body.position) : undefined,
          req.body.volume ? JSON.parse(req.body.volume) : undefined,
          savedSound && files.sound.length < 1
            ? `src/public/reels/${savedSound}`
            : undefined,
        ],
        {
          on: function (event) {
            res.write(JSON.stringify(event) + '\n');
          },
        }
      );

      // Delete unneccessary files (sound, cover)
      await deleteReelFiles(files, ['reel']);
      next();
    } catch {
      await deleteReelFiles(files);
      res.status(savedSoundError ? 404 : 500).end(
        JSON.stringify({
          status: 'fail',
          message: savedSoundError
            ? 'This saved sound does not exist!'
            : 'Unable to process files.',
        }) + '\n'
      );
    }
  }
);

export const saveReel = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    res.write(JSON.stringify({ status: 'success', message: 'saving' }) + '\n');

    let files =
      (req.files as {
        [fieldname: string]: Express.Multer.File[];
      }) || {};
    files = {
      reel: files.reel || [],
      sound: files.sound || [],
    };

    try {
      const mentions = JSON.parse(req.body.mentions);
      const settings = JSON.parse(req.body.settings);
      const collaborators = JSON.parse(req.body.collaborators) || [];

      const file = files.reel[0];

      // Get user's location
      const location = await getUserLocation(req.clientIp);

      const reel = await Reel.create({
        user: req.user?._id,
        src:
          process.env.NODE_ENV === 'production'
            ? file.path
            : path.basename(file.path),
        description: req.body.description,
        keywords: (() => {
          if (req.body.description) {
            const doc = nlp(req.body.description);
            const nounPhrases = doc.nouns().out('array');
            const unique = [
              ...new Set(nounPhrases.map((s: String) => s.toLowerCase())),
            ];

            return unique;
          }

          return undefined;
        })(),
        location,
        settings,
        hasSound: !!req.body.savedSound || files.sound.length > 0,
      });

      // send mention notifications
      await handleMentionNotifications(
        'create',
        'reel',
        mentions,
        req.user?._id,
        reel._id,
        settings.accessibility,
        { text: req.body.description }
      );

      // send collaboration notifications
      await sendCollaborationRequests(
        collaborators,
        req.user?._id,
        'reel',
        reel._id
      );

      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          message: 'finish',
          data: {
            reel,
          },
        }) + '\n'
      );
    } catch {
      await deleteReelFiles(files);
      return res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to create reel.',
        }) + '\n'
      );
    }
  }
);

export const saveReelSound = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const uploader = upload.single('sound');

    uploader(req, res, async (error: any) => {
      const file = req.file as Express.Multer.File;

      try {
        if (error) {
          const message = error.isOperational
            ? error.message
            : error.code === 'LIMIT_FILE_SIZE'
            ? 'File size must not exceed 1GB.'
            : 'File upload failed.';
          throw new CustomError(
            message,
            error.isOperational || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500
          );
        }

        if (!file)
          throw new CustomError('Please select a file to upload.', 400);

        // Check if file is an audio
        if (!file.mimetype.startsWith('audio'))
          throw new CustomError('Invalid file type.', 400);

        const reelSounds = req.user?.reelSounds || [];
        if (reelSounds.length >= 10)
          throw new CustomError(
            'You’ve reached your limit of 10 saved sounds. Please remove one to add a new sound.',
            400
          );

        const duration = await new Promise<number>((resolve, reject) => {
          ffmpeg.ffprobe(file.path, (err, metadata) => {
            const error = new Error() as CustomError;
            error.statusCode = 400;

            if (err) {
              error.statusCode = 500;
              error.message = 'Error occured while uploading file.';
              return reject(error);
            }

            const duration = metadata.format.duration;

            if (!duration) {
              error.message = 'Please select a valid file type.';
              return reject(error);
            }

            if (duration > 3600) {
              error.message = `Audio duration must not exceed an hour.`;
              return reject(error);
            }

            resolve(duration);
          });
        });

        const soundId = crypto.randomUUID();

        reelSounds.push({
          _id: soundId,
          name: file.originalname,
          src:
            process.env.NODE_ENV === 'production'
              ? file.path
              : path.basename(file.path),
          duration,
        });

        const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
            reelSounds,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        const userData = protectData(user!, 'user');

        return res.status(201).json({
          status: 'success',
          data: {
            user: userData,
            soundId,
          },
        });
      } catch (err) {
        if (file) {
          if (process.env.NODE_ENV === 'production') {
            await handleCloudinary('delete', file.filename, 'raw');
          } else {
            await fs.promises.unlink(file.path as fs.PathLike);
          }
        }
        return next(err);
      }
    });
  }
);

export const deleteReelSound = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    let reelSounds = req.user?.reelSounds || [];

    const sound = reelSounds.find((file: any) => String(file._id) === id);

    if (!sound) return next(new CustomError('This sound does not exist!', 404));

    try {
      if (process.env.NODE_ENV === 'production') {
        await handleCloudinary(
          'delete',
          `reels/${path.basename(String(sound.src))}`,
          'raw'
        );
      } else {
        await fs.promises.unlink(
          `src/public/reels/${sound.src as fs.PathLike}`
        );
      }
    } catch {
      return next(
        new CustomError('An error occured while deleting sound.', 500)
      );
    }

    reelSounds = reelSounds.filter((file: any) => String(file._id) !== id);

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        reelSounds,
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

export const excludeReelType = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const reel = await Reel.findById(req.params.id);

    if (!reel) return next(new CustomError('This reel does not exist!', 404));

    if (String(reel.user) === String(req.user?._id)) {
      return next(new CustomError("You can't exlude your reel.", 400));
    }

    const keywords = reel.keywords;
    const excluded = new Set([
      ...(req.user?.settings.content.notInterested.reels || []),
      ...keywords,
    ]);

    if (excluded.size > 100) {
      const firstItem = [...excluded].shift();
      excluded.delete(firstItem);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        settings: {
          content: {
            notInterested: {
              reels: [...excluded],
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

export const deleteReel = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const mentions = JSON.parse(req.body.mentions);
    const reel = await Reel.findById(req.params.id);

    if (!reel || String(reel.user) !== String(req.user?._id)) {
      return next(new CustomError('This reel does not exist!', 404));
    }

    await reel.deleteOne();

    // delete mention notifications
    await handleMentionNotifications(
      'delete',
      'reel',
      mentions,
      req.user?._id,
      reel._id,
      null,
      null
    );

    // Deletes reel files
    try {
      if (process.env.NODE_ENV === 'production') {
        await handleCloudinary(
          'delete',
          `reels/${path.basename(String(reel.src))}`,
          'video'
        );
      } else {
        await fs.promises.unlink(`src/public/reels/${reel.src as fs.PathLike}`);
      }
    } catch {}

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export const getReel = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const reel = await Reel.findById(req.params.id).select(
      '-__v -settings -location -keywords'
    );

    // Check reel accessibility settings

    if (!reel) return next(new CustomError('This reel does not exist!', 404));

    return res.status(200).json({
      status: 'success',
      data: {
        reel,
      },
    });
  }
);

export const getPinnedReels = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let reels = req.body.reels;

    if (!reels) return next(new CustomError('No reels provided.', 400));

    if (!(reels instanceof Array)) {
      return next(new CustomError('Invalid request.', 400));
    }

    if (reels.length === 0) {
      return next(new CustomError('No reels provided.', 400));
    }

    reels = reels.map((id) => new Types.ObjectId(String(id)));

    const reelsData = await Reel.aggregate([
      {
        $match: {
          _id: { $in: reels },
        },
      },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'user',
          as: 'user',
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
          src: 1,
          username: { $first: '$user.username' },
          photo: { $first: '$user.photo' },
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        reels: reelsData,
      },
    });
  }
);
