import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../app.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';
import protectData from '../utils/protectData.js';
import Story, { StoryAccessibility, StoryItem } from '../models/storyModel.js';

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

    // Check if users are in the client hidden stories
    const hiddenStories = req.user?.settings.general.hiddenStories || [];

    const stories = await Story.aggregate([
      //  Filter only public stories not from the current user
      {
        $match: {
          user: { $ne: req.user?._id },
          accessibility: StoryAccessibility.EVERYONE,
        },
      },

      //  Get distinct users with public stories
      {
        $group: {
          _id: '$user', // group by user ID to get unique users
        },
      },

      // return users who are not hidden
      {
        $match: {
          _id: { $nin: hiddenStories },
        },
      },

      //  Randomly sample 20 users
      {
        $sample: { size: 20 },
      },

      //  Re-join all their stories (again) using $lookup
      {
        $lookup: {
          from: 'stories', // collection name in DB (lowercase plural)
          localField: '_id', // _id is the userId from step 2
          foreignField: 'user', // user field in the Story collection
          as: 'story',
        },
      },

      //  Filter only public stories inside the joined stories array
      {
        $project: {
          story: {
            $map: {
              input: {
                $filter: {
                  input: '$story',
                  as: 'story',
                  cond: {
                    $eq: ['$$story.accessibility', StoryAccessibility.EVERYONE],
                  },
                },
              },
              as: 'story',
              in: {
                _id: '$$story._id',
                createdAt: '$$story.createdAt',
                media: '$$story.media',
                disableComments: '$$story.disableComments',
                // Add/remove fields as needed
              },
            },
          },
        },
      },
      // Sort each user's stories by createdAt ascending
      {
        $addFields: {
          story: {
            $sortArray: {
              input: '$story',
              sortBy: { createdAt: 1 },
            },
          },
        },
      },

      //  Lookup user info (username, name, photo) from the users collection
      {
        $lookup: {
          from: 'users',
          localField: '_id', // _id is the userId
          foreignField: '_id',
          as: 'userInfo',
        },
      },

      //  Unwrap the userInfo array
      {
        $unwind: '$userInfo',
      },

      //  Final shape of the result
      {
        $project: {
          _id: 0,
          user: '$_id',
          username: '$userInfo.username',
          name: '$userInfo.name',
          photo: '$userInfo.photo',
          story: 1,
        },
      },
    ]);

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        storyFeed: stories,
      },
      { new: true, runValidators: true }
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

export const getStory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id;
    let story;

    if (String(req.user?._id) === id) {
      story = await Story.find({
        user: id,
      }).select('-__v -user -accessibility');
    } else {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(new CustomError('This user does not exist.', 404));
      }

      // Check if user is friends
      story = await Story.find({
        user: req.params.id,
        accessibility: StoryAccessibility.EVERYONE,
      }).select('-__v -user -accessibility');
    }

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
    const storyCount = (await Story.find({ user: req.user?._id })).length || 0;

    const maxCount = 10 - storyCount;

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
        user: req.user?._id,
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

      await Story.insertMany(newStory);

      const story = await Story.find({ user: req.user?._id }).select(
        '-__v -user -accessibility'
      );

      // in production delete story files from server storage
      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          message: 'Story updated!',
          story,
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
    const story = (await Story.findById(req.params.id)) as StoryItem;

    if (!story || String(story.user) !== String(req.user?._id)) {
      return next(new CustomError('This story does not exist!', 404));
    }

    // Deletes user story
    await story.deleteOne();

    // Deletes user story and music file
    if (process.env.NODE_ENV === 'production') {
    } else {
      try {
        const deleteArray = [
          fs.promises.unlink(`src/public/stories/${story.media.src}`),
        ];

        if (!(await Story.findOne({ sound: story.sound }))) {
          deleteArray.push(
            fs.promises.unlink(`src/public/stories/${story.sound}`)
          );
        }

        await Promise.allSettled(deleteArray);
      } catch {}
    }

    const userStory = await Story.find({ user: req.user?._id }).select(
      '-__v -user -accessibility'
    );

    return res.status(200).json({
      status: 'success',
      data: {
        story: userStory,
      },
    });
  }
);

export const hideStory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) return next(new CustomError('This user does not exist!', 404));

    if (String(req.user?._id) === id)
      return next(new CustomError('You cannot hide your story.', 400));

    const hiddenStories = new Set(user.settings.general.hiddenStories || []);
    hiddenStories.add(id);

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        settings: {
          general: {
            hiddenStories: [...hiddenStories],
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
