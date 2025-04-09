import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User, { StoryAccessibility } from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../app.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';
import protectData from '../utils/protectData.js';

// Cloudinary Storage Configuration
const onlineStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).replace('.', '');
    return {
      folder: 'stories', // Cloudinary folder name
      format: ext, // Use the original file extension as format
      public_id: `${(req as AuthRequest).user?._id}-${Date.now()}-${Math.trunc(
        Math.random() * 1000000000
      )}${ext}`, // Unique name
    };
  },
});

const upload = multer({
  storage:
    process.env.NODE_ENV === 'production'
      ? onlineStorage
      : multer.diskStorage({
          destination: (_, __, cb) => {
            cb(null, 'src/public/stories');
          },
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(
              null,
              `${(req as AuthRequest).user?._id}-${Date.now()}-${Math.trunc(
                Math.random() * 1000000000
              )}${ext}`
            );
          },
        }),
  limits: { fileSize: 1_073_741_824 },
  fileFilter: (_, file, cb) => {
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

    if (file.fieldname === 'story') {
      if (
        !file.mimetype.startsWith('image') &&
        !videoTypes.includes(file.mimetype)
      ) {
        return cb(
          new CustomError('Please select only valid file types.', 400) as any
        );
      }
    }

    if (file.fieldname === 'sound') {
      if (!audioTypes.includes(file.mimetype)) {
        return cb(new CustomError('Invalid audio file type.', 400) as any);
      }
    }

    cb(null, true);
  },
});

const deleteStoryFiles = async (files: {
  [fieldname: string]: Express.Multer.File[];
}) => {
  const paths = Object.entries(files).reduce((accumulator, field) => {
    accumulator.push(...field[1].map((data) => data.path));
    return accumulator;
  }, [] as String[]);

  await Promise.allSettled(
    paths.map((path): Promise<void> => {
      return new Promise((resolve, reject) => {
        fs.unlink(path as fs.PathLike, (err) => {
          if (err) reject();
          resolve();
        });
      });
    })
  );
};

export const getStories = asyncErrorHandler(
  async (req: AuthRequest, res: Response, _: NextFunction) => {
    // Select 10 from following, 5 from followers, 5 from others

    const users = await User.aggregate([
      { $match: { _id: { $ne: req.user?._id } } },
      {
        $match: {
          story: {
            $elemMatch: { accessibility: StoryAccessibility.EVERYONE },
          },
        },
      },
      {
        $project: {
          story: {
            $filter: {
              input: '$story',
              as: 's',
              cond: { $eq: ['$$s.accessibility', StoryAccessibility.EVERYONE] },
            },
          },
          username: 1,
          name: 1,
          photo: 1,
        },
      },
      { $unset: ['story.createdAt', 'story.accessibility'] },
      { $sample: { size: 20 } },
    ]);

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        storyFeed: users,
      },
      { new: true, runValidators: true }
    );

    const userData = protectData(user!, [
      'password',
      'emailVerified',
      '__v',
      'active',
      'passwordChangedAt',
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  }
);

export const getStory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user is friends
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomError('This user does not exist.', 404));
    }

    let story = user.story;

    return res.status(200).json({
      status: 'success',
      data: {
        story,
      },
    });
  }
);

export const validateStoryFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const maxCount = 10 - req.user?.story.length;

    const uploader = upload.fields([
      { name: 'story', maxCount: 10 },
      { name: 'sound', maxCount: 1 },
    ]);

    uploader(req, res, async (error: any) => {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
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

        if (files.story.length > maxCount)
          throw new CustomError(
            `You can only upload ${
              maxCount === 1 ? '1 file' : `${maxCount} files`
            }.`,
            400
          );

        const storyFiles = files.story || [];
        if (storyFiles.length === 0) {
          throw new CustomError(
            'You must upload at least one story file.',
            400
          );
        }

        // Gets video and image files
        const videoFiles = storyFiles.filter((file) =>
          file.mimetype.startsWith('video')
        );

        // Checks if video files duration are correct in the worker pool
        await pool.exec('checkVideoFilesDuration', [videoFiles]);

        next();
      } catch (err) {
        await deleteStoryFiles(files);
        next(err);
      }
    });
  }
);

export const processStoryFiles = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'text/plain');
    res.write(
      JSON.stringify({ status: 'success', message: 'Processing started' })
    );

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    // Make sure units like px and deg are removed in the frontend

    try {
      // Process files
      await pool.exec(
        'processStoryFiles',
        [files.story, JSON.parse(req.body.filters).value],
        {
          on: function (event) {
            res.write(JSON.stringify(event));
          },
        }
      );

      next();
    } catch (err) {
      await deleteStoryFiles(files);

      res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to process files.',
        })
      );
    }
  }
);

export const saveStory = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    try {
      const { disableComments, accessibility, volume } = JSON.parse(
        req.body.settings
      );

      const filters = JSON.parse(req.body.filters).value;

      const newStory = files.story.map((file, index) => ({
        media: {
          src:
            process.env.NODE_ENV === 'production'
              ? (file as any).secure_url
              : path.basename(file.path),
          mediaType: file.mimetype.startsWith('video')
            ? 'video'
            : file.mimetype.startsWith('image')
            ? 'image'
            : '',
          filter: filters[index],
        },
        disableComments,
        accessibility,
        sound:
          process.env.NODE_ENV === 'production'
            ? (files.sound[0] as any).secure_url
            : path.basename(files.sound[0].path),
        volume,
      }));

      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $push: {
            story: { $each: newStory },
          },
        },
        {
          runValidators: true,
          new: true,
        }
      );

      // in production delete story files from server storage
      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          message: 'Story updated!',
          story: user?.story,
        })
      );
    } catch (err) {
      await deleteStoryFiles(files);

      return res.status(500).end(
        JSON.stringify({
          status: 'fail',
          message: 'Unable to update story!',
        })
      );
    }
  }
);

export const deleteStory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const storyId = req.params.id;
    const userStories = req.user?.story;
    const story = userStories.id(storyId);

    if (!story) {
      return next(new CustomError('This story does not exist!', 404));
    }

    // Deletes user story
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $pull: { story: { _id: storyId } },
      },
      {
        new: true,
      }
    );

    // Deletes user story and music file
    if (process.env.NODE_ENV === 'production') {
    } else {
      try {
        const deleteArray = [
          fs.promises.unlink(`src/public/stories/${story.media.src}`),
        ];

        if (
          !userStories.find(
            (item: Record<any, any>) =>
              String(item._id) !== storyId && item.sound === story.sound
          )
        )
          deleteArray.push(
            fs.promises.unlink(`src/public/stories/${story.sound}`)
          );

        await Promise.allSettled(deleteArray);
      } catch {}
    }

    return res.status(200).json({
      status: 'success',
      data: {
        story: user?.story,
      },
    });
  }
);

export const hideStory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {}
);
