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
import { handleMentionNotifications } from '../utils/handleNotifications.js';
import cloudinary from '../utils/cloudinary.js';

const upload = multerConfig('reels');

export const reelEmitter = new CustomEvent();

const deleteReelFiles = async (
  files: {
    [fieldname: string]: Express.Multer.File[];
  },
  excluded?: string[]
) => {
  //=> Handle for cloudinary(failed processed files)

  const paths = Object.entries(files).reduce((accumulator, field) => {
    if (!excluded?.includes(field[0]))
      accumulator.push(
        ...field[1].map((data) => {
          if (process.env.NODE_ENV === 'production') return data.filename;
          else return data.path;
        })
      );
    return accumulator;
  }, [] as String[]);

  await Promise.allSettled(
    paths.map((path) => {
      if (process.env.NODE_ENV === 'production') {
        return cloudinary.uploader.destroy(String(path));
      } else {
        return fs.promises.unlink(path as fs.PathLike);
      }
    })
  );
};

export const getReels = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let { page = 0 } = req.query;
    page = Number(page);

    const excluded = req.user?.settings.content.notInterested.reels || [];

    const reels = await Reel.aggregate([
      { $match: { _id: { $ne: req.user?._id } } },
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
      { $match: { similarity: { $lt: 0.4 } } },
      {
        $sample: { size: 10 },
      },
      {
        $project: {
          keywords: 0,
          location: 0,
          settings: 0,
          similarity: 0,
          __v: 0,
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        reels,
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
        if (process.env.NODE_ENV === 'development') {
          await pool.exec('checkVideoFilesDuration', [reelFiles, 3600]);
        } else {
          await checkVideoFilesDuration(reelFiles, 3600);
        }

        next();
      } catch (err) {
        await deleteReelFiles(files);
        next(err);
      }
    });
  }
);

export const processReelFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'text/plain');
    res.write(
      JSON.stringify({ status: 'success', message: 'Processing started' })
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

    try {
      // Process files
      if (process.env.NODE_ENV === 'development') {
        await pool.exec('transformReelFiles', [
          files,
          req.body.position ? JSON.parse(req.body.position) : undefined,
          req.body.volume ? JSON.parse(req.body.volume) : undefined,
        ]);
      } else {
        await transformReelFiles(
          files,
          req.body.position ? JSON.parse(req.body.position) : undefined,
          req.body.volume ? JSON.parse(req.body.volume) : undefined
        );
      }

      // Delete unneccessary files (sound, cover)
      await deleteReelFiles(files, ['reel']);
      next();
    } catch {
      await deleteReelFiles(files);
      res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to process files.',
        })
      );
    }
  }
);

export const saveReel = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let files =
      (req.files as {
        [fieldname: string]: Express.Multer.File[];
      }) || {};
    files = {
      reel: files.reel || [],
    };

    try {
      const mentions = JSON.parse(req.body.mentions);
      const settings = JSON.parse(req.body.settings);

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
        collaborators: (() => {
          if (req.body.collaborators) {
            const collaborators = new Set(JSON.parse(req.body.collaborators));
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
        'reel',
        mentions,
        { id: req.user?._id, name: req.user?.username },
        reel._id,
        settings.accessibility,
        { text: req.body.description }
      );

      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          data: {
            reel,
          },
        })
      );
    } catch {
      await deleteReelFiles(files);
      return res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to create reel.',
        })
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

        const reelSounds = req.user?.reelSounds || [];
        if (reelSounds.length >= 10)
          throw new CustomError(
            'You’ve reached your limit of 10 saved sounds. Please remove one to add a new sound.',
            400
          );

        reelSounds.push({
          name: file.originalname,
          src:
            process.env.NODE_ENV === 'production'
              ? file.path
              : path.basename(file.path),
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
          },
        });
      } catch (err) {
        if (file) {
          if (process.env.NODE_ENV === 'production') {
            await cloudinary.uploader.destroy(file.filename);
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
    let reelSounds = req.user?.reelSounds;

    const sound = reelSounds.find((file: any) => String(file._id) === id);

    if (!sound) return next(new CustomError('This sound does not exist!', 404));

    // Also delte from cloudinary in production
    try {
      if (process.env.NODE_ENV === 'production') {
        await cloudinary.uploader.destroy(
          `reels/${path.basename(String(sound.src))}`
        );
      } else {
        await fs.promises.unlink(
          `src/public/reels/${sound.src as fs.PathLike}`
        );
      }
    } catch {}

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
      { id: req.user?._id, name: req.user?.username },
      reel._id,
      null,
      null
    );

    // Deletes reel files
    try {
      if (process.env.NODE_ENV === 'production') {
        await cloudinary.uploader.destroy(
          `reels/${path.basename(String(reel.src))}`
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
