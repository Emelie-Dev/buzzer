import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import View from '../models/viewModel.js';
import Comment from '../models/commentModel.js';
import Like from '../models/likeModel.js';
import { Model, PipelineStage } from 'mongoose';
import Share from '../models/shareModel.js';

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
  timeField: 'likedAt' | 'createdAt',
  matchObj: {}
) => {
  const [value, type] = range;

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
        creator: creatorId,
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
            },
          },
        },
      }
    );
  }

  const stats = await model.aggregate(pipeline);

  const expr = (date: Date) => {
    let labelText;

    switch (type) {
      case 'y':
        labelText = `${date.getFullYear()}`;
        break;

      case 'm':
        labelText = `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
        break;

      case 'd':
        labelText = `${
          monthLabels[date.getMonth()]
        } ${date.getDate()}, ${date.getFullYear()}`;
        break;

      default:
        const hour = date.getHours();
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

  while (startDate < endDate) {
    const date = startDate.toISOString();
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
        : date.slice(0, date.lastIndexOf(':'));

    const count = stats.find(
      (obj) => obj._id === label || obj.startDate === label
    );

    let labelText = expr(startDate);
    if (+value > 1) labelText += ` - ${expr(secondDate)}`;

    result.push({ label: labelText, value: count ? count.count : 0 });
    startDate = new Date(timestamp);
  }

  return result;
};

export const getEngagementStats = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const type = req.params.type;
    const period = req.body.period;

    const allowedTypes = ['profile', 'views', 'likes', 'comments', 'shares'];
    const allowedPeriod = ['1y', '1m', '1w', '1d', 'all'];

    if (
      !(
        allowedTypes.includes(type) &&
        (allowedPeriod.includes(period) || (period.start && period.end))
      )
    ) {
      return next(new CustomError('Invalid request!', 400));
    }

    let startDate = period.start ? new Date(period.start) : new Date();
    const endDate = period.end ? new Date(period.end) : new Date();
    let model: Model<any>,
      matchObj = {},
      range;
    const timeField = type === 'likes' ? 'likedAt' : 'createdAt';

    if (
      period instanceof Object &&
      (String(startDate) === 'Invalid Date' ||
        String(endDate) === 'Invalid Date')
    ) {
      return next(new CustomError('Invalid request!', 400));
    }

    if (period === '1d') startDate.setMinutes(0, 0, 0);
    else startDate.setHours(0, 0, 0, 0);

    switch (type) {
      case 'profile':
        model = View;
        matchObj = { collectionName: 'user' };
        break;

      case 'views':
        model = View;
        matchObj = { collectionName: { $ne: 'user' } };
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
        startDate.setMonth(startDate.getMonth() - 1);
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
          .findOne({ creator: req.user?._id })
          .sort({ [timeField]: 1 });
        startDate = firstDocument[timeField];
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
      matchObj
    );

    return res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  }
);

export const getMonthlyEngagementStats = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();

    const models = [
      {
        type: 'profile',
        model: View,
        matchObj: { collectionName: 'user' },
      },
      {
        type: 'views',
        model: View,
        matchObj: { collectionName: { $ne: 'user' } },
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
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $group: {
              _id: null,
              counts: { $push: '$count' },
            },
          },
          {
            $project: {
              type,
              diff: {
                $subtract: [
                  { $arrayElemAt: ['$counts', 1] },
                  { $arrayElemAt: ['$counts', 0] },
                ],
              },
              percent: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $arrayElemAt: ['$counts', 1] },
                          { $arrayElemAt: ['$counts', 0] },
                        ],
                      },
                      { $max: [{ $arrayElemAt: ['$counts', 0] }, 1] },
                    ],
                  },
                  100,
                ],
              },
              count: { $arrayElemAt: ['$counts', 1] },
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
