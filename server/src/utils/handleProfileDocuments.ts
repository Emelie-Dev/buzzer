import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import Bookmark from '../models/bookmarkModel.js';
import Like from '../models/likeModel.js';
import { isValidDateString } from '../controllers/commentController.js';
import { PipelineStage } from 'mongoose';

export default async (
  userId: string,
  category: 'all' | 'reels' | 'private' | 'bookmarks' | 'liked',
  query: Record<string, any>
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

  const initialStages = (index: number): PipelineStage[] => {
    const stages: PipelineStage[] = [
      {
        $match: {
          user: userId,
        },
      },
      {
        $match: {
          post: { $ne: [] },
        },
      },
      { $unwind: '$post' },
    ];
    const collection = index === 0 ? 'content' : 'reel';

    if (category === 'bookmarks' || category === 'liked') {
      stages.splice(
        1,
        0,
        category === 'bookmarks'
          ? {
              $lookup: {
                from: `${collection}s`,
                localField: 'documentId',
                foreignField: '_id',
                as: 'post',
              },
            }
          : {
              $lookup: {
                from: `${collection}s`,
                as: 'post',
                let: { documentId: '$documentId', collection },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$collectionName', '$$collection'] },
                          { $eq: ['$_id', '$$documentId'] },
                        ],
                      },
                    },
                  },
                ],
              },
            }
      );

      return stages;
    } else {
      return [];
    }
  };

  const mainStages = (index: number): PipelineStage[] => {
    const collection = index === 0 ? 'content' : 'reel';

    return [
      {
        $match:
          category === 'bookmarks' || category === 'liked' ? {} : matchObj,
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
        $lookup: {
          from: 'views',
          localField:
            category === 'bookmarks' || category === 'liked'
              ? 'post._id'
              : '_id',
          foreignField: 'documentId',
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
          localField:
            category === 'bookmarks' || category === 'liked'
              ? 'post._id'
              : '_id',
          foreignField: 'documentId',
          as: 'likesArray',
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField:
            category === 'bookmarks' || category === 'liked'
              ? 'post._id'
              : '_id',
          foreignField: 'documentId',
          as: 'commentsArray',
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
    })
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
