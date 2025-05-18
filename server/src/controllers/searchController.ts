import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import Search from '../models/searchModel.js';
import getUserLocation from '../utils/getUserLocation.js';
import User from '../models/userModel.js';
import protectData from '../utils/protectData.js';
import mongoose, { Document } from 'mongoose';
import queryFromTypesense from '../utils/queryFromTypesense.js';
import Follow from '../models/followModel.js';
import Content from '../models/contentModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import View from '../models/viewModel.js';

const getQueriesArray = (arr: any[]) => {
  const queries = [...new Set(arr.map(({ query }) => query))];
  return queries;
};

export const handleSearch = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let {
      query,
      page,
      firstUserCreatedAt,
      lastUserCreatedAt,
      firstContentCreatedAt,
      lastContentCreatedAt,
    } = req.query;
    query = String(query).toLowerCase().trim();

    // Check is search exists
    const userSearch = await Search.findOne({
      query,
      searchedAt: {
        $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      },
    });

    if (userSearch) {
      await Search.findByIdAndUpdate(userSearch._id, {
        $inc: { searchCount: 1 },
      });
    } else {
      const location = await getUserLocation(req.clientIp);

      await Search.create({
        user: req.user?._id,
        query,
        location,
      });
    }

    // Update user search history
    const searchHistory = new Set(req.user?.searchHistory || []);
    searchHistory.add(query);

    if (searchHistory.size > 10) {
      const firstElem = Array.from(searchHistory)[0];
      searchHistory.delete(firstElem);
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        searchHistory: [...searchHistory],
      },
      {
        runValidators: true,
        new: true,
      }
    );
    const userData = protectData(user as Document, 'user');

    // Get reels, contents, users

    // Get users
    const matchedUsers = await queryFromTypesense(
      'users',
      {
        q: query,
        query_by: 'username,name',
        filter_by:
          Number(page) === 1
            ? `id:!=${String(req.user?._id)}`
            : `id:!=${String(req.user?._id)} && createdAt:>${Number(
                firstUserCreatedAt
              )} && createdAt:<${Number(lastUserCreatedAt)}`,
        page: Number(page),
        per_page: 30,
        sort_by: 'createdAt:desc',
      },
      ['username', 'photo', 'name', 'createdAt']
    );

    // Get users followers and contents
    const followersData = await Follow.aggregate([
      {
        $match: {
          following: {
            $in: matchedUsers?.map((user) =>
              mongoose.Types.ObjectId.createFromHexString(user.id)
            ),
          },
        },
      },
      {
        $group: {
          _id: '$following',
          followers: { $sum: 1 },
        },
      },
    ]);
    const users = await Promise.all(
      matchedUsers?.map(async (user, index) => {
        const followerObj = followersData.find(
          (doc) => String(doc._id) === user.id
        );
        user.followers = followerObj ? followerObj.followers : 0;

        if (Number(page) === 1) {
          if (index === 0 || index === 1 || index === 2) {
            // - Check if user is friend
            user.latestContents = await Content.find({
              user: user.id,
              'settings.accessibility': ContentAccessibility.EVERYONE,
            })
              .sort({ createdAt: -1 })
              .limit(2);
          }
        }

        return user;
      })!
    );

    // Get contents
    const matchedContents = await queryFromTypesense(
      'contents',
      {
        q: query,
        query_by: 'description',
        filter_by:
          Number(page) === 1
            ? `user:!=${String(req.user?._id)}`
            : `user:!=${String(req.user?._id)} && createdAt:>${Number(
                firstContentCreatedAt
              )} && createdAt:<${Number(lastContentCreatedAt)}`,
        page: Number(page),
        per_page: 30,
        sort_by: 'createdAt:desc',
      },
      ['user', 'description', 'createdAt', 'media']
    );

    // Get contents owners details
    const contentsOwners = await User.find({
      _id: { $in: matchedContents?.map(({ user }) => user) },
    }).select('username photo');

    // Get contents views
    const viewCounts = await View.aggregate([
      {
        $match: {
          collectionName: 'content',
          documentId: {
            $in: matchedContents?.map((user) =>
              mongoose.Types.ObjectId.createFromHexString(user.id)
            ),
          },
        },
      },
      {
        $group: {
          _id: { documentId: '$documentId' },
          views: { $sum: 1 },
        },
      },
    ]);

    const contents = matchedContents?.map((content) => {
      const user = contentsOwners.find(
        (user) => String(user._id) === content.user
      );
      const views = viewCounts.find(
        (data) => String(data._id.documentId) === content.id
      ).views;
      const media = JSON.parse(content.media)[0];

      return { ...content, user, media, views };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        result: {
          users,
          contents,
        },
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
          num_typos: 0,
          sort_by: 'searchCount:desc',
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
          page: 1,
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
