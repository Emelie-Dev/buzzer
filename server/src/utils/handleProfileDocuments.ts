import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import Bookmark from '../models/bookmarkModel.js';
import Like from '../models/likeModel.js';
import { isValidDateString } from '../controllers/commentController.js';
import { PipelineStage } from 'mongoose';
import Friend from '../models/friendModel.js';

export default async (
  userId: string,
  category: 'all' | 'reels' | 'private' | 'bookmarks' | 'liked',
  query: Record<string, any>,
  user?: any,
) => {
  const limit = 20;
  let { sort, cursor, views } = query;
  const cursorDate = new Date(cursor as string);
  views = isNaN(Number(views)) ? Infinity : views;

  const timestamp =
    category === 'bookmarks'
      ? 'savedAt'
      : category === 'liked'
        ? 'likedAt'
        : 'createdAt';

  const matchObj =
    category === 'private'
      ? {
          user: userId,
          'settings.accessibility': ContentAccessibility.YOU,
        }
      : {
          user: userId,
        };

  const sortObj: Record<string, 1 | -1> =
    sort === 'oldest'
      ? { [timestamp]: 1 }
      : sort === 'popular'
        ? { views: -1, [timestamp]: -1 }
        : { [timestamp]: -1 };

  const cursorObj = isValidDateString(cursor)
    ? sort === 'oldest'
      ? { [timestamp]: { $gt: cursorDate } }
      : sort === 'popular'
        ? {
            $or: [
              { views: { $lt: +views } },
              { views: +views, [timestamp]: { $lt: cursorDate } },
            ],
          }
        : { [timestamp]: { $lt: cursorDate } }
    : {};

  const isFriend = !user
    ? null
    : await Friend.exists({
        $or: [
          {
            requester: userId,
            recipient: user?._id,
          },
          { requester: user?._id, recipient: userId },
        ],
      });

  const friendObj = isFriend
    ? {
        'settings.accessibility': { $in: [0, 1] },
      }
    : { 'settings.accessibility': 0 };
  const userMatchObj = { user: user?._id, ...friendObj };

  const initialStages = (index: number): PipelineStage[] => {
    const collection = index === 0 ? 'content' : 'reel';
    let stages: PipelineStage[] = [];

    if (category === 'bookmarks' || category === 'liked') {
      stages = [
        {
          $match: {
            user: userId,
            collectionName: collection,
          },
        },
        {
          $lookup: {
            from: `${collection}s`,
            localField: 'documentId',
            foreignField: '_id',
            as: 'post',
          },
        },
        { $unwind: { path: '$post', preserveNullAndEmptyArrays: false } },
      ];
    } else {
      stages = [];
    }

    return stages;
  };

  const mainStages = (index: number): PipelineStage[] => {
    const collection = index === 0 ? 'content' : 'reel';

    return [
      {
        $match:
          category === 'bookmarks' || category === 'liked'
            ? {}
            : user
              ? userMatchObj
              : matchObj,
      },
      {
        $lookup: {
          from: 'views',
          let: {
            collection:
              category === 'bookmarks' || category === 'liked'
                ? '$collectionName'
                : category === 'reels'
                  ? 'reel'
                  : collection,
            docId:
              category === 'bookmarks' || category === 'liked'
                ? '$post._id'
                : '$_id',
          },
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
          as: 'viewsArray',
        },
      },
      {
        $addFields: {
          views: { $size: '$viewsArray' },
        },
      },
      { $match: cursorObj },
      { $sort: sortObj },
      { $limit: limit },
      {
        $lookup: {
          from: 'likes',
          let: {
            collection:
              category === 'bookmarks' || category === 'liked'
                ? '$collectionName'
                : category === 'reels'
                  ? 'reel'
                  : collection,
            docId:
              category === 'bookmarks' || category === 'liked'
                ? '$post._id'
                : '$_id',
            hide:
              category === 'bookmarks' || category === 'liked'
                ? '$post.settings.hideEngagements'
                : '$settings.hideEngagements',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$$hide', false] },
                        { $eq: ['$user', userId] },
                      ],
                    },
                    { $eq: ['$collectionName', '$$collection'] },
                    { $eq: ['$documentId', '$$docId'] },
                  ],
                },
              },
            },
          ],
          as: 'likesArray',
        },
      },
      {
        $lookup: {
          from: 'comments',
          as: 'commentsArray',
          let: {
            collection:
              category === 'bookmarks' || category === 'liked'
                ? '$collectionName'
                : category === 'reels'
                  ? 'reel'
                  : collection,
            docId:
              category === 'bookmarks' || category === 'liked'
                ? '$post._id'
                : '$_id',
            hide:
              category === 'bookmarks' || category === 'liked'
                ? '$post.settings.hideEngagements'
                : '$settings.hideEngagements',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$$hide', false] },
                        { $eq: ['$user', userId] },
                      ],
                    },
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
          likes: { $size: '$likesArray' },
          comments: { $size: '$commentsArray' },
        },
      },
      {
        $project: {
          createdAt: 1,
          views: 1,
          likes: 1,
          comments: 1,
          src: 1,
          media: {
            src: 1,
            mediaType: 1,
          },
          post: {
            src: 1,
            media: {
              src: 1,
              mediaType: 1,
            },
            _id: 1,
          },
          likedAt: 1,
          savedAt: 1,
        },
      },
    ];
  };

  const collections =
    category === 'bookmarks'
      ? [Bookmark, Bookmark]
      : category === 'liked'
        ? [Like, Like]
        : [Content, Reel];

  let [contents, reels] = await Promise.all(
    collections.map(async (collection, index) => {
      if (user) {
        if (user.settings.general.privacy.value) {
          const users = user.settings.general.privacy.users.map((id: any) =>
            String(id),
          );

          if (!users.includes(String(userId))) return [];
        }
      }

      const pipeline = [
        ...initialStages(index),
        ...mainStages(index),
        {
          $addFields: {
            postType: category === 'reels' || index === 1 ? 'reel' : 'content',
          },
        },
      ];

      if (category === 'reels' && index === 0) return [];

      return await collection.aggregate(pipeline);
    }),
  );

  const posts =
    category === 'reels'
      ? reels
      : [...contents, ...reels]
          .sort((a, b) => {
            if (sort === 'oldest') {
              return +new Date(a[timestamp]) - +new Date(b[timestamp]);
            } else if (sort === 'popular') {
              if (b.views !== a.views) {
                return b.views - a.views;
              }
              return +new Date(b[timestamp]) - +new Date(a[timestamp]);
            } else {
              return +new Date(b[timestamp]) - +new Date(a[timestamp]);
            }
          })
          .slice(0, limit);

  return posts;
};
