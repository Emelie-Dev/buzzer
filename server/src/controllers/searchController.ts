import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Search from '../models/searchModel.js';
import getUserLocation from '../utils/getUserLocation.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';
import mongoose, { Document, PipelineStage, Types } from 'mongoose';
import queryFromTypesense from '../utils/queryFromTypesense.js';
import Content from '../models/contentModel.js';
import Reel from '../models/reelModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import { isValidDateString } from './commentController.js';
import Friend from '../models/friendModel.js';
import Follow from '../models/followModel.js';
import CustomError from '../utils/CustomError.js';

const getQueriesArray = (arr: any[]) => {
  const queries = [...new Set(arr.map(({ query }) => query))];
  return queries;
};

export const handleSearch = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { query, page } = req.query;

    if (!query || String(query).toLowerCase().trim() === '')
      return next(new CustomError('Please provide a query!', 400));

    query = String(query).toLowerCase().trim();

    // Check is search exists
    const userSearch = await Search.findOne({
      query,
    });

    if (userSearch) {
      await Search.findByIdAndUpdate(
        userSearch._id,
        {
          $inc: { searchCount: 1 },
        },
        { new: true }
      );
    } else {
      const location = await getUserLocation(req.clientIp);

      await Search.create({
        user: req.user?._id,
        query,
        location,
      });
    }

    // Update user search history
    const searchHistory = req.user?.searchHistory || [];

    if (searchHistory.length > 0) {
      const index = searchHistory.findIndex(
        (data: any) => data.query === query
      );

      if (index === -1) {
        searchHistory.push({ query });
      } else {
        searchHistory[index].searchedAt = new Date();
      }
    } else {
      searchHistory.push({ query });
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        searchHistory: searchHistory
          .sort(
            (a: any, b: any) =>
              +new Date(b.searchedAt) - +new Date(a.searchedAt)
          )
          .slice(0, 10),
      },
      {
        runValidators: true,
        new: true,
      }
    );
    const userData = protectData(user as Document, 'user');

    // Get reels, contents, users
    const [matchedUsers, matchedContents, matchedReels] = await Promise.all([
      queryFromTypesense(
        'users',
        {
          q: query,
          query_by: 'username,name',
          filter_by: `id:!=${String(req.user?._id)}`,
          page: Number(page),
          per_page: 20,
        },
        ['username', 'photo', 'name', 'createdAt']
      ),
      queryFromTypesense(
        'contents',
        {
          q: query,
          query_by: 'description',
          filter_by: `user:!=${String(req.user?._id)}`,
          page: Number(page),
          per_page: 10,
        },
        ['user', 'description', 'createdAt', 'media']
      ),
      queryFromTypesense(
        'reels',
        {
          q: query,
          query_by: 'description',
          filter_by: `user:!=${String(req.user?._id)}`,
          page: Number(page),
          per_page: 10,
        },
        ['user', 'description', 'createdAt', 'src']
      ),
    ]);

    const results = async () => {
      const results = await Promise.all([
        User.aggregate([
          {
            $match: {
              _id: {
                $in: matchedUsers?.map(
                  (user) => new mongoose.Types.ObjectId(String(user.id))
                ),
              },
            },
          },
          {
            $lookup: {
              from: 'follows',
              localField: '_id',
              foreignField: 'following',
              as: 'followers',
            },
          },
          {
            $project: {
              username: 1,
              name: 1,
              photo: 1,
              createdAt: 1,
              followObj: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$followers',
                      as: 'f',
                      cond: { $eq: ['$$f.follower', req.user?._id] },
                    },
                  },
                  0,
                ],
              },
              followers: { $size: '$followers' },
            },
          },
        ]),
        Content.aggregate([
          {
            $match: {
              _id: {
                $in: matchedContents?.map(
                  (content) => new mongoose.Types.ObjectId(String(content.id))
                ),
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              let: {
                userId: '$user',
                viewerId: req.user?._id,
              },
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
                                { $eq: ['$_id', '$$viewerId'] },
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
              as: 'owner',
            },
          },
          {
            $match: {
              owner: { $ne: [] },
            },
          },
          {
            $lookup: {
              from: 'friends',
              let: {
                userId: '$user',
                viewerId: req.user?._id,
                accessibility: '$settings.accessibility',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $cond: [
                        {
                          $eq: [
                            '$$accessibility',
                            ContentAccessibility.FRIENDS,
                          ],
                        },
                        {
                          $or: [
                            {
                              $and: [
                                { $eq: ['$requester', '$$userId'] },
                                { $eq: ['$recipient', '$$viewerId'] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ['$requester', '$$viewerId'] },
                                { $eq: ['$recipient', '$$userId'] },
                              ],
                            },
                          ],
                        },
                        false,
                      ],
                    },
                  },
                },
              ],
              as: 'friend',
            },
          },
          {
            $match: {
              $or: [
                {
                  $and: [
                    { 'settings.accessibility': ContentAccessibility.YOU },
                    { user: req.user?._id },
                  ],
                },
                {
                  $and: [
                    { 'settings.accessibility': ContentAccessibility.FRIENDS },
                    { friend: { $ne: [] } },
                  ],
                },
                { 'settings.accessibility': ContentAccessibility.EVERYONE },
              ],
            },
          },
          {
            $lookup: {
              from: 'views',
              localField: '_id',
              foreignField: 'documentId',
              as: 'views',
            },
          },
          {
            $addFields: {
              owner: { $first: '$owner' },
            },
          },
          {
            $project: {
              'owner._id': 1,
              'owner.photo': 1,
              'owner.username': 1,
              media: 1,
              description: 1,
              createdAt: 1,
              views: { $size: '$views' },
              type: 'content',
            },
          },
        ]),
        Reel.aggregate([
          {
            $match: {
              _id: {
                $in: matchedReels?.map(
                  (content) => new mongoose.Types.ObjectId(String(content.id))
                ),
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              let: {
                userId: '$user',
                viewerId: req.user?._id,
              },
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
                                { $eq: ['$_id', '$$viewerId'] },
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
              as: 'owner',
            },
          },
          {
            $match: {
              owner: { $ne: [] },
            },
          },
          {
            $lookup: {
              from: 'friends',
              let: {
                userId: '$user',
                viewerId: req.user?._id,
                accessibility: '$settings.accessibility',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $cond: [
                        {
                          $eq: [
                            '$$accessibility',
                            ContentAccessibility.FRIENDS,
                          ],
                        },
                        {
                          $or: [
                            {
                              $and: [
                                { $eq: ['$requester', '$$userId'] },
                                { $eq: ['$recipient', '$$viewerId'] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ['$requester', '$$viewerId'] },
                                { $eq: ['$recipient', '$$userId'] },
                              ],
                            },
                          ],
                        },
                        false,
                      ],
                    },
                  },
                },
              ],
              as: 'friend',
            },
          },
          {
            $match: {
              $or: [
                {
                  $and: [
                    { 'settings.accessibility': ContentAccessibility.YOU },
                    { user: req.user?._id },
                  ],
                },
                {
                  $and: [
                    { 'settings.accessibility': ContentAccessibility.FRIENDS },
                    { friend: { $ne: [] } },
                  ],
                },
                { 'settings.accessibility': ContentAccessibility.EVERYONE },
              ],
            },
          },
          {
            $lookup: {
              from: 'views',
              localField: '_id',
              foreignField: 'documentId',
              as: 'views',
            },
          },
          {
            $addFields: {
              owner: { $first: '$owner' },
            },
          },
          {
            $project: {
              'owner._id': 1,
              'owner.photo': 1,
              'owner.username': 1,
              src: 1,
              description: 1,
              createdAt: 1,
              views: { $size: '$views' },
              type: 'reel',
            },
          },
        ]),
      ]);

      let users = results[0].map((user) => {
        user.score = matchedUsers?.find(
          (obj) => obj.id === String(user._id)
        ).score;
        return user;
      });
      users.sort((a, b) => {
        if (a.score === b.score) {
          if (a.followers === b.followers) {
            return +new Date(b.createdAt) - +new Date(a.createdAt);
          }
          return b.followers - a.followers;
        }
        return b.score - a.score;
      });

      const posts = [...results[1], ...results[2]].map((post) => {
        const arr = post.type === 'reel' ? matchedReels : matchedContents;
        post.score = arr?.find((obj) => obj.id === String(post._id)).score;
        return post;
      });
      posts.sort((a, b) => {
        if (a.score === b.score) {
          if (a.views === b.views) {
            return +new Date(b.createdAt) - +new Date(a.createdAt);
          }
          return b.views - a.views;
        }
        return b.score - a.score;
      });

      if (Number(page) === 1) {
        users = await Promise.all(
          users.map(async (user, index) => {
            if (index === 0 || index === 1 || index === 2) {
              const contents = await Content.find({ user: user._id })
                .sort({ createdAt: -1 })
                .select('media createdAt')
                .limit(2);

              const reels = await Reel.find({ user: user._id })
                .sort({ createdAt: -1 })
                .select('src createdAt')
                .limit(2);

              const posts = [...contents, ...reels];
              posts
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .splice(2);

              user.posts = posts;
              return user;
            }
          })
        );
      }

      return { users, posts };
    };

    return res.status(200).json({
      status: 'success',
      data: {
        results: await results(),
        user: userData,
      },
    });
  }
);

export const getTrendingSearches = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    // 3 from general, 2 from continent, 3 from country, 1 from state, i from city

    const { continent, country, state, city } = req.user?.location;

    // Get trending searches from all over the world
    const generalResult = await Search.aggregate([
      {
        $match: {
          searchedAt: {
            $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
        },
      },
      {
        $sort: { searchCount: 1 },
      },
      { $limit: 6 },
      { $sample: { size: 3 } },
      {
        $project: {
          query: 1,
        },
      },
    ]);

    const generalResultQueries = getQueriesArray(generalResult);

    // Get trending searches from user's continent
    const continentResult = await Search.aggregate([
      {
        $match: {
          'location.continent': continent,
          searchedAt: {
            $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
          query: { $nin: generalResultQueries },
        },
      },
      {
        $sort: { searchCount: 1 },
      },
      { $limit: 5 },
      { $sample: { size: 3 - generalResult.length + 2 } },
      {
        $project: {
          query: 1,
        },
      },
    ]);

    const continentResultQueries = getQueriesArray([
      ...generalResult,
      ...continentResult,
    ]);

    // Get trending searches from user's country
    const countryResult = await Search.aggregate([
      {
        $match: {
          'location.country': country,
          searchedAt: {
            $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
          query: { $nin: continentResultQueries },
        },
      },
      {
        $sort: { searchCount: 1 },
      },
      { $limit: 8 },
      {
        $sample: {
          size: 5 - (generalResult.length + continentResult.length) + 3,
        },
      },
      {
        $project: {
          query: 1,
        },
      },
    ]);

    const countryResultQueries = getQueriesArray([
      ...generalResult,
      ...continentResult,
      ...countryResult,
    ]);

    // Get trending searches from user's state
    const stateResult = await Search.aggregate([
      {
        $match: {
          'location.state': state,
          searchedAt: {
            $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
          query: { $nin: countryResultQueries },
        },
      },
      {
        $sort: { searchCount: 1 },
      },
      { $limit: 9 },
      {
        $sample: {
          size:
            8 -
            (generalResult.length +
              continentResult.length +
              countryResult.length) +
            1,
        },
      },
      {
        $project: {
          query: 1,
        },
      },
    ]);

    const stateResultQueries = getQueriesArray([
      ...generalResult,
      ...continentResult,
      ...countryResult,
      ...stateResult,
    ]);

    // Get trending searches from user's city
    const cityResult = await Search.aggregate([
      {
        $match: {
          'location.city': city,
          searchedAt: {
            $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
          query: { $nin: stateResultQueries },
        },
      },
      {
        $sort: { searchCount: 1 },
      },
      { $limit: 10 },
      {
        $sample: {
          size:
            9 -
            (generalResult.length +
              continentResult.length +
              countryResult.length +
              stateResult.length) +
            1,
        },
      },
      {
        $project: {
          query: 1,
        },
      },
    ]);

    const result = getQueriesArray([
      ...generalResult,
      ...continentResult,
      ...countryResult,
      ...stateResult,
      ...cityResult,
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        result,
      },
    });
  }
);

export const getSearchSuggestions = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let { query } = req.query;
    query = String(query).toLowerCase().trim();

    const [searches, users] = await Promise.all([
      queryFromTypesense(
        'searches',
        {
          q: query,
          query_by: 'query',
          num_typos: 1,
          per_page: 6,
          sort_by: '_text_match:desc, query:asc',
        },
        ['query']
      ),
      queryFromTypesense(
        'users',
        {
          q: query,
          query_by: 'username,name',
          filter_by: `id:!=${String(req.user?._id)}`,
          per_page: 5,
        },
        ['username', 'photo', 'name']
      ),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        suggestions: {
          searches,
          users,
        },
      },
    });
  }
);

export const searchForUsers = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { query, page, cursor, engagement, type } = req.query;

    let result: any[] = [];
    let resultLength = 0;

    const viewerId = req.user?._id;
    const privateAudience: string[] =
      req.user?.settings.general.privacy.users || [];

    if (type) {
      if (type !== 'followers' && type !== 'following') {
        return next(new CustomError('Invalid request', 400));
      }
    }

    if (query) {
      const users =
        (await queryFromTypesense(
          'users',
          {
            q: String(query),
            query_by: 'username,name',
            filter_by: `id:!=${String(viewerId)}`,
            page: Number(page),
            per_page: 30,
          },
          ['id']
        )) || [];

      resultLength = users.length;

      if (users.length > 0) {
        const userIds = users.map(
          (user) => new Types.ObjectId(String(user.id))
        );

        const pipeline: PipelineStage[] = [
          { $match: { _id: { $in: userIds } } },
          {
            $lookup: {
              from: 'follows',
              let: { user: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$following', '$$user'] },
                        {
                          $eq: ['$follower', viewerId],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'followInfo',
            },
          },
          {
            $lookup: {
              from: 'friends',
              let: { user: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$requester', '$$user'] },
                            {
                              $eq: ['$recipient', viewerId],
                            },
                          ],
                        },
                        {
                          $and: [
                            {
                              $eq: ['$requester', viewerId],
                            },
                            { $eq: ['$recipient', '$$user'] },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'friendInfo',
            },
          },
          {
            $addFields: {
              type: {
                $cond: [
                  { $ne: ['$friendInfo', []] },
                  'Friend',
                  {
                    $cond: [
                      { $ne: ['$followInfo', []] },
                      'Following',
                      undefined,
                    ],
                  },
                ],
              },
            },
          },
        ];

        if (engagement === 'true') {
          if (type) {
            if (type === 'followers') {
              pipeline.splice(
                1,
                0,
                {
                  $lookup: {
                    from: 'follows',
                    let: { user: '$_id' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$following', viewerId] },
                              {
                                $eq: ['$follower', '$$user'],
                              },
                            ],
                          },
                        },
                      },
                    ],
                    as: 'followerInfo',
                  },
                },
                {
                  $match: {
                    $expr: {
                      $gt: [{ $size: '$followerInfo' }, 0],
                    },
                  },
                }
              );
            } else {
              pipeline.splice(2, 0, {
                $match: {
                  $expr: {
                    $gt: [{ $size: '$followInfo' }, 0],
                  },
                },
              });
            }
          }

          pipeline.push(
            {
              $lookup: {
                from: 'stories',
                let: { userId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      expired: false,
                      $expr: { $eq: ['$user', '$$userId'] },
                    },
                  },
                  {
                    $lookup: {
                      from: 'views',
                      let: { storyId: '$_id', viewerId: req.user?._id },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                { $eq: ['$collectionName', 'story'] },
                                { $eq: ['$documentId', '$$storyId'] },
                                { $eq: ['$user', '$$viewerId'] },
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
                username: 1,
                photo: 1,
                name: 1,
                createdAt: 1,
                friendObj: { $first: '$friendInfo' },
                followObj: { $first: '$followInfo' },
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
                private: {
                  $in: ['$_id', privateAudience],
                },
              },
            }
          );
        } else {
          pipeline.push({
            $project: {
              username: 1,
              photo: 1,
              name: 1,
              createdAt: 1,
              type: 1,
            },
          });
        }

        result = await User.aggregate(pipeline);
      }
    } else {
      const cursorDate = isValidDateString(String(cursor))
        ? new Date(String(cursor))
        : new Date();

      const following = await Follow.aggregate([
        {
          $match: {
            follower: req.user?._id,
            followedAt: { $lt: cursorDate },
          },
        },
        { $sort: { followedAt: -1 } },
        { $limit: 30 },
        {
          $lookup: {
            from: 'users',
            localField: 'following',
            foreignField: '_id',
            as: 'users',
          },
        },
        {
          $addFields: {
            user: { $first: '$users' },
            createdAt: '$followedAt',
            isFollowing: true,
          },
        },
        {
          $project: {
            _id: 0,
            user: { username: 1, name: 1, photo: 1, _id: 1 },
            isFollowing: 1,
            createdAt: 1,
          },
        },
      ]);

      const friends = await Friend.aggregate([
        {
          $match: {
            $or: [
              {
                requester: req.user?._id,
              },
              { recipient: req.user?._id },
            ],
            createdAt: { $lt: cursorDate },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 30 },
        {
          $addFields: {
            user: {
              $cond: [
                { $eq: ['$requester', viewerId] },
                '$recipient',
                '$requester',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'users',
          },
        },
        { $addFields: { user: { $first: '$users' }, isFriend: true } },
        {
          $project: {
            _id: 0,
            user: { username: 1, name: 1, photo: 1, _id: 1 },
            createdAt: 1,
            isFriend: 1,
          },
        },
      ]);

      const userIds = new Set();

      const total = [...friends, ...following]
        .map((user) => {
          if (userIds.has(user._id)) return null;
          else {
            userIds.add(user._id);
            return user;
          }
        })
        .filter((user) => user)
        .sort((a, b) => {
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        })
        .slice(0, 30);

      if (total.length > 0) {
        result = total.map((doc) => ({
          ...doc.user,
          createdAt: doc.createdAt,
          type: doc.isFriend ? 'Friend' : 'Following',
        }));
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { result, resultLength },
    });
  }
);

export const deleteUserSearch = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id;

    if (!id) return next(new CustomError('Please provide a search Id!', 400));

    let searchHistory = req.user?.searchHistory;

    if (searchHistory.length > 0) {
      if (id === 'all') {
        searchHistory = [];
      } else {
        searchHistory = searchHistory.filter(
          (data: any) => String(data._id) !== id
        );
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        searchHistory,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    const userData = protectData(user as Document, 'user');

    return res
      .status(200)
      .json({ status: 'success', data: { user: userData } });
  }
);
