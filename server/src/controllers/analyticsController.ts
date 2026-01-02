import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import View from '../models/viewModel.js';
import Comment from '../models/commentModel.js';
import Like from '../models/likeModel.js';
import { Model, PipelineStage } from 'mongoose';
import Share from '../models/shareModel.js';
import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import Follow from '../models/followModel.js';
import { isValidDateString } from './commentController.js';
import { DateTime } from 'luxon';

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const getRange = (startDate: string, endDate: string) => {
  const difference = Date.parse(endDate) - Date.parse(startDate);

  if (difference >= 788_400_000_000) {
    return [Math.ceil(difference / 788_400_000_000), 'y'];
  } else if (difference >= 31_536_000_000) {
    return [Math.ceil(difference / 66_960_000_000), 'm'];
  } else if (difference >= 2_160_000_000) {
    return [Math.ceil(difference / 2_160_000_000), 'd'];
  } else if (difference >= 691_200_000) {
    return [1, 'd'];
  } else if (difference >= 86_400_000) {
    return [Math.ceil(difference / 90_000_000), 'h'];
  } else {
    return [1, 'h'];
  }
};

const getStats = async (
  creatorId: string,
  model: Model<any>,
  range: (string | number)[],
  startDate: Date,
  endDate: Date,
  timeField: 'likedAt' | 'createdAt' | 'followedAt',
  timezone: string,
  matchObj: {}
) => {
  const [value, type] = range;
  const userField = timeField === 'followedAt' ? 'following' : 'creator';

  const format =
    type === 'y'
      ? '%Y'
      : type === 'm'
      ? '%Y-%m'
      : type === 'd'
      ? '%Y-%m-%d'
      : '%Y-%m-%dT%H:00';
  const constant =
    type === 'y' ? 24 * 365 : type === 'm' ? 24 * 31 : type === 'd' ? 24 : 1;

  const pipeline: PipelineStage[] = [
    {
      $match: {
        [userField]: creatorId,
        [timeField]: {
          $gte: startDate,
          $lte: endDate,
        },
        ...matchObj,
      },
    },
    { $sort: { _id: 1 } },
  ];

  if (value === 1) {
    pipeline.splice(1, 0, {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: `$${timeField}`,
            timezone,
          },
        },
        count: { $sum: 1 },
      },
    });
  } else {
    pipeline.splice(
      1,
      0,
      {
        $addFields: {
          rangeIndex: {
            $floor: {
              $divide: [
                { $subtract: [`$${timeField}`, startDate] },
                1000 * 60 * 60 * constant * +value,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: '$rangeIndex',
          count: { $sum: 1 },
        },
      },
      {
        $addFields: {
          startDate: {
            $dateToString: {
              format,
              date: {
                $add: [
                  startDate,
                  { $multiply: [1000 * 60 * 60 * constant * +value, '$_id'] },
                ],
              },
              timezone,
            },
          },
          endDate: {
            $dateToString: {
              format,
              date: {
                $add: [
                  startDate,
                  { $multiply: [1000 * 60 * 60 * constant * +value, '$_id'] },
                  1000 * 60 * 60 * constant * (+value - 1),
                ],
              },
              timezone,
            },
          },
        },
      }
    );
  }

  const stats = await model.aggregate(pipeline);

  const expr = (date: Date) => {
    const clientDate = DateTime.fromJSDate(date, {
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).setZone(timezone);

    let labelText;

    switch (type) {
      case 'y':
        labelText = `${clientDate.year}`;
        break;

      case 'm':
        labelText = `${monthLabels[clientDate.month - 1]} ${clientDate.year}`;
        break;

      case 'd':
        labelText = `${monthLabels[clientDate.month - 1]} ${clientDate.day}`;
        break;

      default:
        const hour = clientDate.hour;
        labelText =
          hour === 0
            ? '12 AM'
            : hour === 12
            ? '12 PM'
            : hour > 11
            ? `${hour - 12} PM`
            : `${hour} AM`;
    }

    return labelText;
  };

  const result = [];

  while (startDate <= endDate) {
    const date = DateTime.fromJSDate(startDate, {
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
      .setZone(timezone)
      .toISO()!;

    let timestamp =
      Date.parse(String(startDate)) + 1000 * 60 * 60 * constant * +value;
    const secondDate = new Date(
      Date.parse(String(startDate)) + 1000 * 60 * 60 * constant * (+value - 1)
    );

    const label =
      type === 'y'
        ? date.slice(0, date.indexOf('-'))
        : type === 'm'
        ? date.slice(0, date.lastIndexOf('-'))
        : type === 'd'
        ? date.slice(0, date.indexOf('T'))
        : date.slice(0, date.indexOf(':') + 3);

    const count = stats.find(
      (obj) => obj._id === label || obj.startDate === label
    );

    let labelText = expr(startDate);
    if (+value > 1 && secondDate <= endDate)
      labelText += ` - ${expr(secondDate)}`;

    result.push({ label: labelText, value: count ? count.count : 0 });
    startDate = new Date(timestamp);
  }

  return result;
};

export const getEngagementStats = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const type = req.params.type;
    const period = req.body.period;

    const allowedTypes = ['profile', 'post', 'likes', 'comments', 'shares'];
    const allowedPeriod = ['1y', '1m', '1w', '1d', 'all'];

    if (
      !(
        allowedTypes.includes(type) &&
        (allowedPeriod.includes(period) || (period.start && period.end))
      )
    ) {
      return next(new CustomError('Invalid request!', 400));
    }

    if (period instanceof Object) {
      if (!isValidDateString(period.start) || !isValidDateString(period.end)) {
        return next(new CustomError('Invalid request!', 400));
      }
    }

    const prevMonth = new Date();
    let startDate = period.start ? new Date(period.start) : new Date();
    const endDate = period.end ? new Date(period.end) : new Date();
    let model: Model<any>,
      matchObj = {},
      range;
    const timeField = type === 'likes' ? 'likedAt' : 'createdAt';

    if (period === '1d') startDate.setMinutes(0, 0, 0);
    else startDate.setHours(0, 0, 0, 0);

    switch (type) {
      case 'profile':
        model = View;
        matchObj = { collectionName: 'user' };
        break;

      case 'post':
        model = View;
        matchObj = { collectionName: { $in: ['content', 'reel'] } };
        break;

      case 'likes':
        model = Like;
        break;

      case 'comments':
        model = Comment;
        break;

      case 'shares':
        model = Share;
        break;

      default:
        model = View;
    }

    switch (period) {
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(1);
        range = [1, 'm'];
        break;

      case '1m':
        startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 0);
        startDate.setDate(Math.min(prevMonth.getDate(), startDate.getDate()));
        startDate.setHours(0, 0, 0, 0);
        range = [2, 'd'];
        break;

      case '1w':
        startDate.setDate(startDate.getDate() - 7);
        range = [1, 'd'];
        break;

      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        range = [1, 'h'];
        break;

      case 'all':
        const firstDocument = await model
          .findOne({
            creator: req.user?._id,
            ...matchObj,
          })
          .sort({ [timeField]: 1 });
        startDate = firstDocument ? firstDocument[timeField] : new Date();

        if (
          Date.parse(String(endDate)) - Date.parse(String(startDate)) <
          86_400_000
        ) {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
          startDate.setMinutes(0, 0, 0);
        } else {
          startDate.setHours(0, 0, 0, 0);
        }

        range = getRange(String(startDate), String(endDate));
        break;

      default:
        range = getRange(String(startDate), String(endDate));
    }

    const stats = await getStats(
      req.user?._id,
      model,
      range,
      startDate,
      endDate,
      timeField,
      req.clientTimeZone!,
      matchObj
    );

    return res.status(200).json({
      status: 'success',
      data: {
        stats,
        rangeType: +range[0] > 1 ? 'r' : range[1],
      },
    });
  }
);

export const getMonthlyEngagementStats = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const prevMonth = new Date();
    const startDate = new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth(),
      0
    );
    startDate.setDate(Math.min(prevMonth.getDate(), startDate.getDate()));
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();

    const startString = `${startDate.getFullYear()}-${
      startDate.getMonth() + 1
    }`;
    const endString = `${endDate.getFullYear()}-${endDate.getMonth() + 1}`;

    const models = [
      {
        type: 'profile',
        model: View,
        matchObj: { collectionName: 'user' },
      },
      {
        type: 'post',
        model: View,
        matchObj: { collectionName: { $in: ['content', 'reel'] } },
      },
      {
        type: 'likes',
        model: Like,
      },
      {
        type: 'comments',
        model: Comment,
      },
      {
        type: 'shares',
        model: Share,
      },
    ];

    const result = await Promise.all(
      models.map(async ({ type, model, matchObj = {} }) => {
        const timeField = type === 'likes' ? 'likedAt' : 'createdAt';

        return await model.aggregate([
          {
            $match: {
              creator: req.user?._id,
              [timeField]: {
                $gte: startDate,
                $lte: endDate,
              },
              ...matchObj,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m',
                  date: `$${timeField}`,
                },
              },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              count: {
                start: { $cond: [{ $eq: ['$_id', startString] }, '$total', 0] },
                end: { $cond: [{ $eq: ['$_id', endString] }, '$total', 0] },
              },
            },
          },
          {
            $project: {
              type,
              diff: {
                $subtract: ['$count.end', '$count.start'],
              },
              percent: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: ['$count.end', '$count.start'],
                      },
                      { $max: ['$count.start', 1] },
                    ],
                  },
                  100,
                ],
              },
              count: '$count.end',
            },
          },
        ]);
      })
    );

    const stats = models.reduce((accumulator, data) => {
      const type = data.type;
      const obj = result.find((obj: any) => {
        if (obj[0]) return obj[0].type === type;
        else return false;
      });

      accumulator[type] = {
        diff: obj ? (obj[0].diff > 0 ? `+${obj[0].diff}` : obj[0].diff) : 0,
        percent: obj ? obj[0].percent : 0,
        count: obj ? obj[0].count : 0,
      };

      return accumulator;
    }, {} as any);

    return res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  }
);

export const getPosts = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { sort, period, order, cursor } = req.body;

    const allowedSort = ['likes', 'views', 'createdAt'];
    const allowedPeriod = ['1y', '1m', '1w', '1d', 'all'];
    const allowedOrder = ['up', 'down'];

    if (
      !(
        allowedSort.includes(sort) &&
        allowedOrder.includes(order) &&
        (allowedPeriod.includes(period) || (period.start && period.end))
      )
    ) {
      return next(new CustomError('Invalid request!', 400));
    }

    if (period instanceof Object) {
      if (!isValidDateString(period.start) || !isValidDateString(period.end)) {
        return next(new CustomError('Invalid request!', 400));
      }
    }

    const prevMonth = new Date();
    let initialDate: Date = null!;
    let startDate = period.start ? new Date(period.start) : new Date();
    const endDate = period.end ? new Date(period.end) : new Date();
    const cursorDate: Date = await new Promise(async (resolve) => {
      if (isValidDateString(cursor)) {
        resolve(new Date(cursor));
      } else if (order === 'up') {
        const [firstContent, firstReel] = await Promise.all([
          Content.findOne({ user: req.user?._id }).sort({ createdAt: 1 }),
          Reel.findOne({ user: req.user?._id }).sort({ createdAt: 1 }),
        ]);

        const date = new Date(
          Math.min(
            Date.parse(
              String(firstContent ? firstContent?.createdAt : new Date())
            ),
            Date.parse(String(firstReel ? firstReel?.createdAt : new Date()))
          )
        );
        initialDate = date;
        resolve(date);
      } else {
        resolve(new Date());
      }
    });
    const operator = order === 'up' ? '$gt' : '$lt';
    const sortValue =
      typeof req.body[sort] === 'number'
        ? req.body[sort]
        : order === 'up'
        ? 0
        : Infinity;
    const limit = 20;

    switch (period) {
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(1);
        break;

      case '1m':
        startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 0);
        startDate.setDate(Math.min(prevMonth.getDate(), startDate.getDate()));
        break;

      case '1w':
        startDate.setDate(startDate.getDate() - 7);
        break;

      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;

      case 'all':
        if (initialDate) {
          startDate = initialDate;
        } else {
          const [firstContent, firstReel] = await Promise.all([
            Content.findOne({ user: req.user?._id }).sort({ createdAt: 1 }),
            Reel.findOne({ user: req.user?._id }).sort({ createdAt: 1 }),
          ]);
          startDate = new Date(
            Math.min(
              Date.parse(
                String(firstContent ? firstContent?.createdAt : new Date())
              ),
              Date.parse(String(firstReel ? firstReel?.createdAt : new Date()))
            )
          );
        }
        break;
    }

    if (period === '1d') startDate.setMinutes(0, 0, 0);
    else startDate.setHours(0, 0, 0, 0);

    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'up' ? 1 : -1 };
    if (sort !== 'createdAt') sortObj.createdAt = -1;

    const cursorObj = isValidDateString(cursor)
      ? sort !== 'createdAt'
        ? {
            $or: [
              { [sort]: { [operator]: +sortValue } },
              { [sort]: +sortValue, createdAt: { $lt: cursorDate } },
            ],
          }
        : { createdAt: { [operator]: cursorDate } }
      : {};

    const pipeline = (index: number): PipelineStage[] => {
      const collection = index === 0 ? 'content' : 'reel';
      const result = [
        {
          $match: {
            user: req.user?._id,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $lookup: {
            from: 'views',
            as: 'views',
            let: { collection, docId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$collectionName', '$$collection'] },
                      { $eq: ['$documentId', '$$docId'] },
                    ],
                  },
                },
              },
            ],
          },
        },
        {
          $addFields: {
            views: { $size: '$views' },
            likes: sort === 'likes' ? { $size: '$likes' } : null,
            type: index === 0 ? 'content' : 'reel',
          },
        },
        { $match: cursorObj },
        { $sort: sortObj },
        { $limit: limit },
        {
          $project: {
            type: 1,
            createdAt: 1,
            views: 1,
            likes: 1,
            description: 1,
            src: 1,
            mediaType: 1,
          },
        },
      ];

      if (index === 0) {
        result[2].$addFields = {
          ...result[2].$addFields,
          src: { $first: '$media.src' },
          mediaType: { $first: '$media.mediaType' },
        } as any;
      }

      if (sort === 'likes') {
        result.splice(2, 0, {
          $lookup: {
            from: 'likes',
            as: 'likes',
            let: { collection, docId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$collectionName', '$$collection'] },
                      { $eq: ['$documentId', '$$docId'] },
                    ],
                  },
                },
              },
            ],
          },
        });
      }

      return result;
    };

    const result = await Promise.all(
      [Content, Reel].map(
        async (model, index) => await model.aggregate(pipeline(index))
      )
    );

    const count = (
      await Promise.all(
        [Content, Reel].map(
          async (model) =>
            await model.countDocuments({
              user: req.user?._id,
              createdAt: { $gte: startDate, $lte: endDate },
            })
        )
      )
    ).reduce((acc, value) => acc + value, 0);

    const posts = result
      .flat()
      .sort((a, b) => {
        if (sort !== 'createdAt') {
          if (b[sort] !== a[sort]) {
            return order === 'up' ? a[sort] - b[sort] : b[sort] - a[sort];
          }

          return +new Date(b.createdAt) - +new Date(a.createdAt);
        } else {
          return order === 'up'
            ? +new Date(a.createdAt) - +new Date(b.createdAt)
            : +new Date(b.createdAt) - +new Date(a.createdAt);
        }
      })
      .slice(0, limit);

    return res.status(200).json({
      status: 'sucess',
      data: {
        posts,
        count,
      },
    });
  }
);

export const getPostStats = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const type = req.query.type;
    const id = req.params.id;

    if (type !== 'reel' && type !== 'content') {
      return next(new CustomError('Invalid request!', 400));
    }

    const model: Model<any> = type === 'reel' ? Reel : Content;
    const document = await model.findById(id);

    if (!document || String(document.user) !== String(req.user?._id)) {
      return next(new CustomError(`This ${type} does not exist!`, 404));
    }

    const stats = await model.aggregate([
      {
        $match: {
          _id: document._id,
        },
      },
      {
        $lookup: {
          from: 'views',
          as: 'views',
          let: { type, docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$collectionName', '$$type'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'likes',
          let: { type, docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$collectionName', '$$type'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
          as: 'likes',
        },
      },
      {
        $lookup: {
          from: 'comments',
          let: { type, docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$collectionName', '$$type'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
          as: 'comments',
        },
      },
      {
        $lookup: {
          from: 'shares',
          let: { type, docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$collectionName', '$$type'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
          as: 'shares',
        },
      },
      {
        $lookup: {
          from: 'bookmarks',
          let: { type, docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$collectionName', '$$type'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
          as: 'saves',
        },
      },
      {
        $lookup: {
          from: 'follows',
          let: { type, docId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$collectionName', '$$type'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
          as: 'followers',
        },
      },
      {
        $project: {
          createdAt: 1,
          likes: { $size: '$likes' },
          comments: { $size: '$comments' },
          shares: { $size: '$shares' },
          saves: { $size: '$saves' },
          followers: { $size: '$followers' },
          viewers: {
            $size: {
              $setUnion: [
                {
                  $map: {
                    input: '$views',
                    as: 'view',
                    in: '$$view.user',
                  },
                },
                [],
              ],
            },
          },
          views: { $size: '$views' },
          totalPlayTime: '$playTime',
          avgPlayTime: {
            $divide: ['$playTime', { $max: [{ $size: '$views' }, 1] }],
          },
          watchedFully: {
            $min: [
              {
                $multiply: [
                  {
                    $divide: [
                      '$watchedFully',
                      { $max: [{ $size: '$views' }, 1] },
                    ],
                  },
                  100,
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        stats: stats[0],
      },
    });
  }
);

export const getFollowersStats = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const period = req.body.period;
    const allowedPeriod = ['1y', '1m', '1w', '1d', 'all'];

    if (!(allowedPeriod.includes(period) || (period.start && period.end))) {
      return next(new CustomError('Invalid request!', 400));
    }

    if (period instanceof Object) {
      if (!isValidDateString(period.start) || !isValidDateString(period.end)) {
        return next(new CustomError('Invalid request!', 400));
      }
    }

    const prevMonth = new Date();
    let startDate = period.start ? new Date(period.start) : new Date();
    const endDate = period.end ? new Date(period.end) : new Date();
    let range;

    if (period === '1d') startDate.setMinutes(0, 0, 0);
    else startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(1);
        range = [1, 'm'];
        break;

      case '1m':
        startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 0);
        startDate.setDate(Math.min(prevMonth.getDate(), startDate.getDate()));
        startDate.setHours(0, 0, 0, 0);
        range = [2, 'd'];
        break;

      case '1w':
        startDate.setDate(startDate.getDate() - 7);
        range = [1, 'd'];
        break;

      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        range = [1, 'h'];
        break;

      case 'all':
        const firstDocument = await Follow.findOne({
          following: req.user?._id,
        }).sort({ followedAt: 1 });
        startDate = firstDocument ? firstDocument.followedAt : new Date();

        if (
          Date.parse(String(endDate)) - Date.parse(String(startDate)) <
          86_400_000
        ) {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
          startDate.setMinutes(0, 0, 0);
        } else {
          startDate.setHours(0, 0, 0, 0);
        }

        range = getRange(String(startDate), String(endDate));
        break;

      default:
        range = getRange(String(startDate), String(endDate));
    }

    const stats = await getStats(
      req.user?._id,
      Follow,
      range,
      startDate,
      endDate,
      'followedAt',
      req.clientTimeZone!,
      {}
    );

    const count = await Follow.countDocuments({
      following: req.user?._id,
      followedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        stats,
        rangeType: +range[0] > 1 ? 'r' : range[1],
        count,
      },
    });
  }
);
