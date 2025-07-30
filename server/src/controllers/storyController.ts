import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import User from '../models/userModel.js';
import CustomError from '../utils/CustomError.js';
import path from 'path';
import fs from 'fs';
import { pool } from '../app.js';
import protectData from '../utils/protectData.js';
import Story, {
  ContentAccessibility,
  StoryItem,
} from '../models/storyModel.js';
import multerConfig from '../utils/multerConfig.js';
// @ts-ignore
import { checkVideoFilesDuration } from '../worker.js';
import Follow from '../models/followModel.js';
import { Document } from 'mongoose';
import handleCloudinary from '../utils/handleCloudinary.js';

const upload = multerConfig('stories');

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const deleteStoryFiles = async (files: {
  [fieldname: string]: Express.Multer.File[];
}) => {
  const paths = Object.entries(files).reduce((accumulator, field) => {
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
    paths.map(({ path, type }): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (process.env.NODE_ENV === 'production') {
          handleCloudinary('delete', path, type as 'image' | 'video' | 'raw')
            .then(() => resolve())
            .catch((err) => reject(err));
        } else {
          fs.unlink(path as fs.PathLike, (err) => {
            if (err) reject();
            resolve();
          });
        }
      });
    })
  );
};

export const getStories = asyncErrorHandler(
  async (req: AuthRequest, res: Response, _: NextFunction) => {
    // Select 10 from following, 5 from followers, 5 from others

    // Check if users are in the client hidden stories
    const hiddenStories = req.user?.settings.general.hiddenStories || [];
    const { feedExpires, feed } = req.user?.storyFeed;
    let stories,
      user = req.user as Document<unknown, any, any> | null;

    if (!feedExpires || new Date(feedExpires) < new Date()) {
      const followingStories = await Follow.aggregate([
        {
          $match: {
            $and: [
              { follower: req.user?._id },
              { following: { $nin: hiddenStories } },
            ],
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: { followingId: '$following' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$followingId'] },
                      { $ne: ['$accessibility', ContentAccessibility.YOU] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'friends',
                  let: {
                    viewerId: req.user?._id,
                    storyOwnerId: '$user',
                    access: '$accessibility',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$$access', ContentAccessibility.FRIENDS] },
                            {
                              $or: [
                                {
                                  $and: [
                                    { $eq: ['$requester', '$$storyOwnerId'] },
                                    { $eq: ['$recipient', '$$viewerId'] },
                                  ],
                                },
                                {
                                  $and: [
                                    { $eq: ['$requester', '$$viewerId'] },
                                    { $eq: ['$recipient', '$$storyOwnerId'] },
                                  ],
                                },
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
                  $expr: {
                    $or: [
                      {
                        $and: [
                          {
                            $eq: [
                              '$accessibility',
                              ContentAccessibility.FRIENDS,
                            ],
                          },
                          { $gt: [{ $size: '$isFriend' }, 0] },
                        ],
                      },
                      {
                        $eq: ['$accessibility', ContentAccessibility.EVERYONE],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'likes',
                  let: { viewerId: req.user?._id, storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$$storyId', '$documentId'] },
                            { $eq: ['$$viewerId', '$user'] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'like',
                },
              },
              {
                $addFields: {
                  like: { $first: '$like' },
                },
              },
              {
                $project: {
                  isFriend: 0,
                  user: 0,
                  __v: 0,
                },
              },
            ],
            as: 'stories',
          },
        },
        {
          $match: { stories: { $ne: [] } },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'following',
            foreignField: '_id',
            let: { followingId: '$following', viewerId: req.user?._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$followingId'] },
                      {
                        $cond: [
                          { $eq: ['$settings.general.privacy.value', true] },
                          {
                            $cond: [
                              {
                                $in: [
                                  '$$viewerId',
                                  '$settings.general.privacy.users',
                                ],
                              },
                              true,
                              false,
                            ],
                          },
                          true,
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'user',
          },
        },
        { $match: { user: { $ne: [] } } },
        { $sample: { size: 10 } },
        {
          $addFields: {
            user: { $first: '$user' },
          },
        },
        {
          $project: {
            _id: 0,
            stories: 1,
            user: {
              _id: 1,
              username: 1,
              name: 1,
              photo: 1,
            },
          },
        },
      ]);
      const followingIds =
        followingStories.length > 0
          ? followingStories.map((user) => user.user._id)
          : [];

      const followerStories = await Follow.aggregate([
        {
          $match: {
            $and: [
              { following: req.user?._id },
              { follower: { $nin: [...followingIds, ...hiddenStories] } },
            ],
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: { followerId: '$follower' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$followerId'] },
                      { $ne: ['$accessibility', ContentAccessibility.YOU] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'friends',
                  let: {
                    viewerId: req.user?._id,
                    storyOwnerId: '$user',
                    access: '$accessibility',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$$access', ContentAccessibility.FRIENDS] },
                            {
                              $or: [
                                {
                                  $and: [
                                    { $eq: ['$requester', '$$storyOwnerId'] },
                                    { $eq: ['$recipient', '$$viewerId'] },
                                  ],
                                },
                                {
                                  $and: [
                                    { $eq: ['$requester', '$$viewerId'] },
                                    { $eq: ['$recipient', '$$storyOwnerId'] },
                                  ],
                                },
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
                  $expr: {
                    $or: [
                      {
                        $and: [
                          {
                            $eq: [
                              '$accessibility',
                              ContentAccessibility.FRIENDS,
                            ],
                          },
                          { $gt: [{ $size: '$isFriend' }, 0] },
                        ],
                      },
                      {
                        $eq: ['$accessibility', ContentAccessibility.EVERYONE],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'likes',
                  let: { viewerId: req.user?._id, storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$$storyId', '$documentId'] },
                            { $eq: ['$$viewerId', '$user'] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'like',
                },
              },
              {
                $addFields: {
                  like: { $first: '$like' },
                },
              },
              {
                $project: {
                  isFriend: 0,
                  user: 0,
                  __v: 0,
                },
              },
            ],
            as: 'stories',
          },
        },
        {
          $match: { stories: { $ne: [] } },
        },
        {
          $lookup: {
            from: 'users',
            let: { followerId: '$follower', viewerId: req.user?._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$followerId'] },
                      {
                        $cond: [
                          { $eq: ['$settings.general.privacy.value', true] },
                          {
                            $cond: [
                              {
                                $in: [
                                  '$$viewerId',
                                  '$settings.general.privacy.users',
                                ],
                              },
                              true,
                              false,
                            ],
                          },
                          true,
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'user',
          },
        },
        { $match: { user: { $ne: [] } } },
        { $sample: { size: 5 + (10 - followingStories.length) } },
        {
          $addFields: {
            user: { $first: '$user' },
          },
        },
        {
          $project: {
            _id: 0,
            stories: 1,
            user: {
              _id: 1,
              username: 1,
              name: 1,
              photo: 1,
            },
          },
        },
      ]);
      const usersArr1 = [...followingStories, ...followerStories];
      const followerIds =
        usersArr1.length > 0 ? usersArr1.map((user) => user.user._id) : [];

      const otherStories = await User.aggregate([
        {
          $match: {
            $and: [
              { _id: { $ne: req.user?._id } },
              { _id: { $nin: [...followerIds, ...hiddenStories] } },
            ],
          },
        },
        {
          $match: {
            $expr: {
              $cond: [
                { $eq: ['$settings.general.privacy.value', true] },
                {
                  $cond: [
                    {
                      $in: [req.user?._id, '$settings.general.privacy.users'],
                    },
                    true,
                    false,
                  ],
                },
                true,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $ne: ['$accessibility', ContentAccessibility.YOU] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'friends',
                  let: {
                    viewerId: req.user?._id,
                    storyOwnerId: '$user',
                    access: '$accessibility',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$$access', ContentAccessibility.FRIENDS] },
                            {
                              $or: [
                                {
                                  $and: [
                                    { $eq: ['$requester', '$$storyOwnerId'] },
                                    { $eq: ['$recipient', '$$viewerId'] },
                                  ],
                                },
                                {
                                  $and: [
                                    { $eq: ['$requester', '$$viewerId'] },
                                    { $eq: ['$recipient', '$$storyOwnerId'] },
                                  ],
                                },
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
                  $expr: {
                    $or: [
                      {
                        $and: [
                          {
                            $eq: [
                              '$accessibility',
                              ContentAccessibility.FRIENDS,
                            ],
                          },
                          { $gt: [{ $size: '$isFriend' }, 0] },
                        ],
                      },
                      {
                        $eq: ['$accessibility', ContentAccessibility.EVERYONE],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'likes',
                  let: { viewerId: req.user?._id, storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$$storyId', '$documentId'] },
                            { $eq: ['$$viewerId', '$user'] },
                          ],
                        },
                      },
                    },
                  ],
                  as: 'like',
                },
              },
              {
                $addFields: {
                  like: { $first: '$like' },
                },
              },
              {
                $project: {
                  isFriend: 0,
                  user: 0,
                  __v: 0,
                },
              },
            ],
            as: 'stories',
          },
        },
        {
          $match: { stories: { $ne: [] } },
        },
        { $sample: { size: 5 + (15 - usersArr1.length) } },
        {
          $project: {
            _id: 0,
            stories: 1,
            user: {
              _id: '$_id',
              username: '$username',
              name: '$name',
              photo: '$photo',
            },
          },
        },
      ]);

      stories = shuffleArray([
        ...followingStories,
        ...followerStories,
        ...otherStories,
      ]);

      user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          'storyFeed.feedExpires': Date.now() + 24 * 60 * 60 * 1000,
          'storyFeed.feed': stories.map((story) => story.user),
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      const userFeed = feed.map((user: string) => user);

      const usersStories = await Story.aggregate([
        {
          $match: {
            user: { $in: userFeed },
            accessibility: { $ne: ContentAccessibility.YOU },
          },
        },
        {
          $lookup: {
            from: 'friends',
            let: {
              viewerId: req.user?._id,
              storyOwnerId: '$user',
              access: '$accessibility',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$access', ContentAccessibility.FRIENDS] },
                      {
                        $or: [
                          {
                            $and: [
                              { $eq: ['$requester', '$$storyOwnerId'] },
                              { $eq: ['$recipient', '$$viewerId'] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ['$requester', '$$viewerId'] },
                              { $eq: ['$recipient', '$$storyOwnerId'] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'friends',
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                {
                  $and: [
                    {
                      $eq: ['$accessibility', ContentAccessibility.FRIENDS],
                    },
                    { $gt: [{ $size: '$friends' }, 0] },
                  ],
                },
                {
                  $eq: ['$accessibility', ContentAccessibility.EVERYONE],
                },
              ],
            },
          },
        },
        {
          $project: {
            friends: 0,
          },
        },
        {
          $lookup: {
            from: 'likes',
            let: { viewerId: req.user?._id, storyId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$storyId', '$documentId'] },
                      { $eq: ['$$viewerId', '$user'] },
                    ],
                  },
                },
              },
            ],
            as: 'like',
          },
        },
        {
          $addFields: {
            like: { $first: '$like' },
          },
        },
        {
          $group: {
            _id: '$user',
            stories: { $push: '$$ROOT' },
          },
        },
        {
          $lookup: {
            from: 'users',
            let: { userId: '$_id', viewerId: req.user?._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$userId'] },
                      {
                        $cond: [
                          { $eq: ['$settings.general.privacy.value', true] },
                          {
                            $cond: [
                              {
                                $in: [
                                  '$$viewerId',
                                  '$settings.general.privacy.users',
                                ],
                              },
                              true,
                              false,
                            ],
                          },
                          true,
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'users',
          },
        },
        { $match: { users: { $ne: [] } } },
        {
          $addFields: {
            user: { $first: '$users' },
          },
        },
        {
          $project: {
            users: 0,
            _id: 0,
          },
        },
        {
          $project: {
            'user._id': 1,
            'user.name': 1,
            'user.username': 1,
            'user.photo': 1,
            stories: 1,
          },
        },
      ]);

      stories = feed
        .map((user: string) =>
          usersStories.find((obj: any) => String(obj.user._id) === String(user))
        )
        .filter((user: any) => user);
    }

    const userData = protectData(user!, 'user');
    const userStories = await Story.find({ user: req.user?._id });

    return res.status(200).json({
      status: 'success',
      data: {
        user: userData,
        userStories,
        users: stories,
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
        accessibility: ContentAccessibility.EVERYONE,
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
      let files =
        (req.files as {
          [fieldname: string]: Express.Multer.File[];
        }) || {};
      files = { story: files.story || [], sound: files.sound || [] };

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

        const storyFiles = files.story;
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

        // Checks if video files duration is valid
        if (process.env.NODE_ENV === 'development') {
          await pool.exec('checkVideoFilesDuration', [videoFiles, 300]);
        } else {
          await checkVideoFilesDuration(videoFiles, 300);
        }

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
        'processFiles',
        [files.story, JSON.parse(req.body.filters).value],
        {
          on: function (event) {
            res.write(JSON.stringify(event));
          },
        }
      );

      next();
    } catch {
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
              ? file.path
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
        sound: files.sound
          ? process.env.NODE_ENV === 'production'
            ? files.sound[0].path
            : path.basename(files.sound[0].path)
          : '',
        volume,
      }));

      await Story.insertMany(newStory);

      const story = await Story.find({ user: req.user?._id }).select(
        '-__v -user -accessibility'
      );

      return res.status(201).end(
        JSON.stringify({
          status: 'success',
          data: { story },
        })
      );
    } catch {
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

    let deleteArray = [];

    try {
      // Deletes user story and music file
      if (process.env.NODE_ENV === 'production') {
        deleteArray.push(
          handleCloudinary(
            'delete',
            `stories/${path.basename(String(story.media.src))}`,
            story.media.mediaType
          )
        );

        if (story.sound) {
          if (!(await Story.findOne({ sound: story.sound }))) {
            deleteArray.push(
              handleCloudinary(
                'delete',
                `stories/${path.basename(String(story.sound))}`,
                'raw'
              )
            );
          }
        }
      } else {
        deleteArray.push(
          fs.promises.unlink(`src/public/stories/${story.media.src}`)
        );

        if (story.sound) {
          if (!(await Story.findOne({ sound: story.sound }))) {
            deleteArray.push(
              fs.promises.unlink(`src/public/stories/${story.sound}`)
            );
          }
        }
      }
      await Promise.allSettled(deleteArray);
    } catch {}

    return res.status(200).json({
      status: 'success',
      message: null,
    });
  }
);

export const updatetory = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let story = (await Story.findById(req.params.id)) as StoryItem;

    if (!story || String(story.user) !== String(req.user?._id)) {
      return next(new CustomError('This story does not exist!', 404));
    }

    const { accessibility, disableComments } = story;

    story = (await Story.findByIdAndUpdate(
      story._id,
      {
        accessibility: req.body.accessibility ?? accessibility,
        disableComments: req.body.comments ?? disableComments,
      },
      {
        new: true,
        runValidators: true,
      }
    )) as StoryItem;

    return res.status(200).json({
      status: 'success',
      data: {
        story,
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

    let list = req.user?.settings.general.hiddenStories || [];
    if (list.length > 0) list = list.map((value: string) => String(value));

    const hiddenStories = new Set(list);
    hiddenStories.add(id);

    if (hiddenStories.size > 100) {
      hiddenStories.delete(list[0]);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        'settings.general.hiddenStories': [...hiddenStories],
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
