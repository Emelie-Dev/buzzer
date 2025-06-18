import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import Bookmark from '../models/bookmarkModel.js';
import Like from '../models/likeModel.js';

export default async (
  userId: string,
  category: 'all' | 'reels' | 'private' | 'bookmarks' | 'liked',
  query: Record<string, any>
) => {
  const limit = 20;
  const { sort, cursor, views = Infinity } = query;
  const cursorDate = new Date(cursor as string);

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

  const cursorObj =
    String(cursorDate) !== 'Invalid Date'
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

  const initialStages =
    category === 'bookmarks' || category === 'liked'
      ? [
          {
            $match: {
              user: userId,
            },
          },
          {
            $lookup: {
              from: 'contents',
              localField: 'documentId',
              foreignField: '_id',
              as: 'post',
            },
          },
          { $unwind: '$post' },
        ]
      : [];

  const mainStages = [
    {
      $match: category === 'bookmarks' || category === 'liked' ? {} : matchObj,
    },
    {
      $lookup: {
        from: 'views',
        localField:
          category === 'bookmarks' || category === 'liked' ? 'post._id' : '_id',
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
          category === 'bookmarks' || category === 'liked' ? 'post._id' : '_id',
        foreignField: 'documentId',
        as: 'likesArray',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField:
          category === 'bookmarks' || category === 'liked' ? 'post._id' : '_id',
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
        viewsArray: 0,
        likesArray: 0,
        commentsArray: 0,
        'post.settings': 0,
        'post.location': 0,
        'post.__v': 0,
        __v: 0,
      },
    },
  ];

  const collections =
    category === 'bookmarks'
      ? [Bookmark, Bookmark]
      : category === 'liked'
      ? [Like, Like]
      : [Content, Reel];

  let [contents, reels] = await Promise.all(
    collections.map(async (collection, index) => {
      const pipeline = [
        ...initialStages,
        ...mainStages,
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
