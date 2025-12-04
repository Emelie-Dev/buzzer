import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/CustomError.js';
import Content from '../models/contentModel.js';
import Comment from '../models/commentModel.js';
import Reel from '../models/reelModel.js';
import {
  handleCreateNotifications,
  handleDeleteNotifications,
  handleMentionNotifications,
} from '../utils/handleNotifications.js';
import { ContentAccessibility } from '../models/storyModel.js';
import { Types } from 'mongoose';
import Like from '../models/likeModel.js';
import { convert } from 'html-to-text';
import truncate from 'truncate-html';

export const isValidDateString = (str: string): boolean => {
  const date = new Date(str);
  return !isNaN(date.getTime());
};

export const addComment = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId, text, reply, mentions } = req.body;
    collection = collection.toLowerCase();

    if (!collection || !documentId || !text) {
      return next(new CustomError(`Invalid request.`, 404));
    }

    const query =
      collection === 'content'
        ? Content.findById(documentId)
        : collection === 'reel'
        ? Reel.findById(documentId)
        : null;

    const data = (await query!.populate('user')) as Record<string, any>;

    // Check if item exists
    if (!data) {
      return next(new CustomError(`This ${collection} does not exist.`, 404));
    }

    if (reply) {
      const commentExists = await Comment.exists({ _id: reply.commentId });

      if (!commentExists) {
        return next(new CustomError(`This comment does not exist.`, 404));
      }
    }

    const textContent = convert(text.trim(), { wordwrap: null });

    if (textContent.length > 2000) {
      return next(
        new CustomError('Comment can’t exceed 2000 characters.', 400)
      );
    }

    const viewerId = req.user?._id;

    // Check if content owner enabled commenting
    const disableComments = data.settings.disableComments;
    if (disableComments) {
      return next(
        new CustomError(`Commenting is disabled for this ${collection}.`, 403)
      );
    }

    const comment = await Comment.create({
      user: viewerId,
      creator: data.user._id,
      collectionName: collection,
      documentId: data._id,
      text,
      reply,
    });

    // Handle notifications
    const allowNotifications =
      data.user.settings.content.notifications.interactions.comments;

    // @ts-expect-error/common js
    const truncatedText = truncate(text, {
      stripTags: false,
      ellipsis: '....',
      length: 50,
    });

    if (allowNotifications) {
      // Handle notifications
      if (reply) {
        const originalComment = await Comment.findById(reply.commentId);

        await handleCreateNotifications(
          'reply',
          viewerId,
          {
            user: { _id: reply.receiver || originalComment!.user },
            _id: reply.commentId,
          },
          collection,
          {
            value: data.user.settings.content.notifications.push,
            subscription: data.user.pushSubscription,
          },
          { text: truncatedText, commentId: comment._id, postId: data._id }
        );
      } else {
        await handleCreateNotifications(
          'comment',
          viewerId,
          data,
          collection,
          {
            value: data.user.settings.content.notifications.push,
            subscription: data.user.pushSubscription,
          },
          { text: truncatedText, commentId: comment._id }
        );
      }
    }

    // send mention notifications
    await handleMentionNotifications(
      'create',
      'comment',
      mentions,
      viewerId,
      comment._id,
      ContentAccessibility.EVERYONE,
      { text: truncatedText, collection, postId: documentId }
    );

    const commentData = await Comment.aggregate([
      {
        $match: {
          _id: comment._id,
        },
      },
      {
        $lookup: {
          from: 'stories',
          localField: 'user',
          foreignField: 'user',
          as: 'stories',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'users',
          pipeline: [{ $project: { name: 1, photo: 1, username: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'reply.receiver',
          foreignField: '_id',
          as: 'receiver',
          pipeline: [{ $project: { name: 1, photo: 1, username: 1 } }],
        },
      },
      {
        $addFields: {
          user: { $first: '$users' },
          receiver: { $first: '$receiver' },
          likes: 0,
          hasStory: {
            $gt: [{ $size: '$stories' }, 0],
          },
          hasUnviewedStory: false,
          repliesCount: 0,
          ownerLiked: false,
          ownerReply: undefined,
          ownerReplyLikeDetails: undefined,
          likeObj: undefined,
        },
      },
      {
        $project: {
          user: 1,
          text: 1,
          createdAt: 1,
          likes: 1,
          hasStory: 1,
          hasUnviewedStory: 1,
          repliesCount: 1,
          ownerLiked: 1,
          documentId: 1,
          collectionName: 1,
          ownerReply: 1,
          ownerReplyLikeDetails: 1,
          likeObj: 1,
          receiver: 1,
          mentions: 1,
          reply: 1,
        },
      },
    ]);

    return res.status(201).json({
      status: 'success',
      data: { message: 'Comment added!', comment: commentData[0] },
    });
  }
);

export const deleteComment = asyncErrorHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let { collection, documentId, mentions, reply } = req.body;
    collection = collection.toLowerCase();

    const comment = await Comment.findById(req.params.id);

    if (!comment || String(comment.user) !== String(req.user?._id)) {
      return next(new CustomError('This comment does not exist.', 404));
    }

    await comment.deleteOne();

    await Comment.deleteMany({ 'reply.commentId': req.params.id });
    await Like.deleteMany({
      $or: [{ documentId: req.params.id }, { 'data.commentId': req.params.id }],
    });

    // Handle notifications
    await handleDeleteNotifications(
      comment.reply ? 'reply' : 'comment',
      req.user?._id,
      comment.reply ? reply.commentId : documentId,
      collection,
      { commentId: comment._id }
    );

    // delete mention notifications
    await handleMentionNotifications(
      'delete',
      'comment',
      mentions,
      req.user?._id,
      comment._id,
      null,
      null
    );

    return res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export const getComments = asyncErrorHandler(
  async (req: AuthRequest, res: Response) => {
    let {
      collection,
      documentId,
      cursor,
      reply,
      commentId,
      excludeArray = [],
    } = req.body;
    collection = String(collection).toLowerCase().trim();

    const query =
      collection === 'content'
        ? await Content.findById(documentId)
        : collection === 'reel'
        ? await Reel.findById(documentId)
        : null;

    const replyValue = String(reply) === 'true' ? true : false;

    const viewerId = req.user?._id;
    const ownerId = query?.user;
    const collaborators = query?.collaborators;

    let comments, totalCount;

    excludeArray = excludeArray.map(
      (id: string) => new Types.ObjectId(String(id))
    );

    if (replyValue) {
      let firstStage: any = {
        $match: {
          _id: { $nin: excludeArray },
          'reply.commentId': new Types.ObjectId(String(commentId)),
          collectionName: collection,
          documentId: new Types.ObjectId(String(documentId)),
        },
      };

      let match: any = {
        _id: { $nin: excludeArray },
        'reply.commentId': commentId,
        collectionName: collection,
        documentId,
      };

      if (isValidDateString(String(cursor))) {
        firstStage['$match'] = {
          ...firstStage['$match'],
          createdAt: { $gt: new Date(String(cursor)) },
        };

        match = { ...match, createdAt: { $gt: new Date(String(cursor)) } };
      }

      comments = await Comment.aggregate([
        firstStage,
        { $sort: { createdAt: 1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'likes',
            let: { commentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$documentId', '$$commentId'] },
                          { $eq: ['$user', viewerId] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ['$documentId', '$$commentId'] },
                          { $eq: ['$user', ownerId] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'likeStatus',
          },
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'documentId',
            as: 'likes',
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: { commentOwner: '$user' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user', '$$commentOwner'] },
                },
              },
              {
                $lookup: {
                  from: 'views',
                  let: { storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$documentId', '$$storyId'] },
                            { $eq: ['$user', viewerId] },
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
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'users',
            pipeline: [{ $project: { name: 1, photo: 1, username: 1 } }],
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reply.receiver',
            foreignField: '_id',
            as: 'receiver',
            pipeline: [{ $project: { name: 1, photo: 1, username: 1 } }],
          },
        },
        {
          $addFields: {
            isOwner: {
              $cond: {
                if: {
                  $and: [
                    { $eq: [{ $type: '$reply.receiver' }, 'missing'] },
                    { $eq: ['$user', ownerId] },
                  ],
                },
                then: true,
                else: false,
              },
            },
            isViewer: {
              $cond: {
                if: {
                  $and: [
                    { $eq: [{ $type: '$reply.receiver' }, 'missing'] },
                    { $eq: ['$user', viewerId] },
                  ],
                },
                then: true,
                else: false,
              },
            },
            isCollaborator: {
              $cond: {
                if: {
                  $and: [
                    { $eq: [{ $type: '$reply.receiver' }, 'missing'] },
                    { $in: ['$user', collaborators] },
                  ],
                },
                then: true,
                else: false,
              },
            },
            user: { $first: '$users' },
            receiver: { $first: '$receiver' },
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
            likes: { $size: '$likes' },
            viewerLiked: {
              $in: [viewerId, '$likeStatus.user'],
            },
            ownerLiked: {
              $in: [ownerId, '$likeStatus.user'],
            },
          },
        },
        {
          $addFields: {
            rankScore: {
              $add: [
                { $cond: ['$isOwner', 100, 0] },
                { $cond: ['$isViewer', 80, 0] },
                { $cond: ['$isCollaborator', 70, 0] },
              ],
            },
          },
        },
        { $sort: { rankScore: -1, createdAt: 1 } },
        {
          $project: {
            user: 1,
            receiver: 1,
            text: 1,
            createdAt: 1,
            likes: 1,
            hasStory: 1,
            hasUnviewedStory: 1,
            ownerLiked: 1,
            documentId: 1,
            collectionName: 1,
            likeObj: {
              $first: {
                $filter: {
                  input: '$likeStatus',
                  as: 'status',
                  cond: { $eq: ['$$status.user', viewerId] },
                },
              },
            },
            reply: 1,
            mentions: 1,
          },
        },
      ]);

      totalCount = await Comment.countDocuments(match);
    } else {
      const cursorDate = isValidDateString(String(cursor))
        ? new Date(String(cursor))
        : new Date();

      // viewer comments > Owner comments > Most liked > Has owner reply > Most Replies > Relevant to viewer > Verified/known users > Viewer liked > Owner liked > Recency

      comments = await Comment.aggregate([
        {
          $match: {
            collectionName: collection,
            documentId: new Types.ObjectId(String(documentId)),
            reply: { $exists: false },
            createdAt: { $lt: cursorDate },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'likes',
            let: { commentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$documentId', '$$commentId'] },
                          { $eq: ['$user', viewerId] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ['$documentId', '$$commentId'] },
                          { $eq: ['$user', ownerId] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'likeStatus',
          },
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'documentId',
            as: 'likes',
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'reply.commentId',
            as: 'replies',
            pipeline: [{ $sort: { createdAt: 1 } }],
          },
        },
        {
          $lookup: {
            from: 'friends',
            let: { commentOwner: '$user' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$requester', '$$commentOwner'] },
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
                          { $eq: ['$recipient', '$$commentOwner'] },
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
          $lookup: {
            from: 'follows',
            let: { commentOwner: '$user' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$following', '$$commentOwner'] },
                          { $eq: ['$follower', viewerId] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ['$following', viewerId] },
                          { $eq: ['$follower', '$$commentOwner'] },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  isFollowing: {
                    $and: [
                      { $eq: ['$following', '$$commentOwner'] },
                      { $eq: ['$follower', viewerId] },
                    ],
                  },
                  isFollower: {
                    $and: [
                      { $eq: ['$following', viewerId] },
                      { $eq: ['$follower', '$$commentOwner'] },
                    ],
                  },
                },
              },
            ],
            as: 'followStatus',
          },
        },
        {
          $lookup: {
            from: 'follows',
            localField: 'user',
            foreignField: 'following',
            as: 'followers',
          },
        },
        {
          $lookup: {
            from: 'stories',
            let: { commentOwner: '$user' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user', '$$commentOwner'] },
                },
              },
              {
                $lookup: {
                  from: 'views',
                  let: { storyId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$documentId', '$$storyId'] },
                            { $eq: ['$user', viewerId] },
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
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'users',
            pipeline: [{ $project: { name: 1, photo: 1, username: 1 } }],
          },
        },
        {
          $addFields: {
            ownerReply: {
              $first: {
                $filter: {
                  input: '$replies',
                  as: 'reply',
                  cond: {
                    $and: [
                      { $eq: ['$$reply.user', ownerId] },
                      { $eq: [{ $type: '$$reply.receiver' }, 'missing'] },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'likes',
            localField: 'ownerReply._id',
            foreignField: 'documentId',
            as: 'ownerReplyLikes',
          },
        },
        {
          $lookup: {
            from: 'likes',
            let: {
              commentId: '$ownerReply._id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$documentId', '$$commentId'] },
                          { $eq: ['$user', viewerId] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ['$documentId', '$$commentId'] },
                          { $eq: ['$user', ownerId] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'ownerReplyLikeStatus',
          },
        },
        {
          $addFields: {
            user: { $first: '$users' },
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
            isViewerComment: { $eq: ['$user', viewerId] },
            isOwnerComment: { $eq: ['$user', ownerId] },
            isCollaboratorComment: { $in: ['$user', collaborators] },
            likes: { $size: '$likes' },
            hasOwnerReply: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$ownerReply', null] },
                    { $eq: [{ $type: '$ownerReply' }, 'missing'] },
                    { $eq: ['$ownerReply', {}] },
                  ],
                },
                then: false,
                else: true,
              },
            },
            repliesCount: { $size: '$replies' },
            isFriend: { $gt: [{ $size: '$isFriend' }, 0] },
            isFollowing: {
              $cond: [
                { $gt: [{ $size: '$followStatus' }, 0] },
                { $arrayElemAt: ['$followStatus.isFollowing', 0] },
                false,
              ],
            },
            isFollower: {
              $cond: [
                { $gt: [{ $size: '$followStatus' }, 0] },
                { $arrayElemAt: ['$followStatus.isFollower', 0] },
                false,
              ],
            },
            followers: { $size: '$followers' },
            viewerLiked: {
              $in: [viewerId, '$likeStatus.user'],
            },
            ownerLiked: {
              $in: [ownerId, '$likeStatus.user'],
            },
          },
        },
        {
          $addFields: {
            rankScore: {
              $add: [
                { $cond: ['$isViewerComment', 100, 0] },
                { $cond: ['$isOwnerComment', 80, 0] },
                { $cond: ['$isCollaboratorComment', 70, 0] },
                { $multiply: ['$likes', 3] },
                { $cond: ['$hasOwnerReply', 50, 0] },
                { $multiply: ['$repliesCount', 1.5] },
                { $cond: ['$isFriend', 40, 0] },
                { $cond: ['$isFollowing', 30, 0] },
                { $cond: ['$isFollower', 20, 0] },
                { $multiply: [{ $log10: { $add: ['$followers', 1] } }, 10] },
                { $cond: ['$viewerLiked', 15, 0] },
                { $cond: ['$ownerLiked', 10, 0] },
              ],
            },
          },
        },
        { $sort: { rankScore: -1, createdAt: -1 } },
        {
          $project: {
            user: 1,
            text: 1,
            createdAt: 1,
            likes: 1,
            hasStory: 1,
            hasUnviewedStory: 1,
            repliesCount: 1,
            ownerLiked: 1,
            documentId: 1,
            collectionName: 1,
            ownerReply: 1,
            ownerReplyLikeDetails: {
              likes: { $size: '$ownerReplyLikes' },
              viewerLiked: {
                $in: [viewerId, '$ownerReplyLikeStatus.user'],
              },
              ownerLiked: {
                $in: [ownerId, '$ownerReplyLikeStatus.user'],
              },
              likeObj: {
                $first: {
                  $filter: {
                    input: '$ownerReplyLikeStatus',
                    as: 'status',
                    cond: { $eq: ['$$status.user', viewerId] },
                  },
                },
              },
            },
            likeObj: {
              $first: {
                $filter: {
                  input: '$likeStatus',
                  as: 'status',
                  cond: { $eq: ['$$status.user', viewerId] },
                },
              },
            },
            mentions: 1,
          },
        },
      ]);

      totalCount = await Comment.countDocuments({
        collectionName: collection,
        documentId,
      });
    }

    const nextCursor =
      comments.length > 0
        ? [...comments]
            .sort((a, b) => {
              return replyValue
                ? +new Date(a.createdAt) - +new Date(b.createdAt)
                : +new Date(b.createdAt) - +new Date(a.createdAt);
            })
            .slice(comments.length - 1)[0].createdAt
        : null;

    return res
      .status(200)
      .json({ status: 'success', data: { comments, totalCount, nextCursor } });
  }
);
