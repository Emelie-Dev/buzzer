import Friend from '../models/friendModel.js';
import Notification from '../models/notificationModel.js';
import { ContentAccessibility } from '../models/storyModel.js';
import User from '../models/userModel.js';
import webpush, { PushSubscription } from 'web-push';

export const handleCreateNotifications = async (
  type: 'like' | 'comment' | 'reply',
  userId: any,
  data: Record<string, any>,
  collection: string,
  pushSubscription: PushSubscription,
  obj: Record<string, any> = {}
) => {
  const ownerId = data.user._id;

  if (String(ownerId) !== String(userId)) {
    const notifications = await Notification.find({
      user: ownerId,
      type: [type, collection],
      documentId: data._id,
    }).sort('-createdAt');

    const batchNotification = await Notification.findOne({
      user: ownerId,
      type: [type, collection, 'batch'],
      documentId: data._id,
    });

    if (notifications.length >= 20 && !batchNotification) {
      // Deletes some previous notifications
      const deleteArray = notifications
        .slice(4, notifications.length)
        .map((data) => data._id);

      await Notification.create({
        user: ownerId,
        type: [type, collection],
        secondUser: userId,
        documentId: data._id,
        data: {
          ...obj,
        },
      });

      await Notification.create({
        user: ownerId,
        secondUser: notifications[4].secondUser,
        type: [type, collection, 'batch'],
        documentId: data._id,
        data: {
          batchCount: deleteArray.length - 1,
        },
      });

      await Notification.deleteMany({
        _id: { $in: deleteArray },
      });
    } else if (batchNotification) {
      await Notification.findByIdAndDelete(notifications[4]._id);

      await Notification.create({
        user: ownerId,
        type: [type, collection],
        secondUser: userId,
        documentId: data._id,
        data: {
          ...obj,
        },
      });

      await Notification.findByIdAndUpdate(
        batchNotification._id,
        {
          secondUser: notifications[4].secondUser,
          $inc: { 'data.batchCount': 1 },
        },
        {
          runValidators: true,
        }
      );
    } else {
      await Notification.create({
        user: ownerId,
        type: [type, collection],
        secondUser: userId,
        documentId: data._id,
        data: {
          ...obj,
        },
      });
    }

    if (pushSubscription) {
      await webpush.sendNotification(
        pushSubscription as PushSubscription,
        JSON.stringify({
          title: type,
          body: 'Someone liked your post 🎉',
        })
      );
    }
  }
};

export const handleDeleteNotifications = async (
  type: 'like' | 'comment' | 'reply',
  userId: any,
  documentId: string,
  collection: string,
  obj: Record<string, any> = {}
) => {
  let notification;

  if (type === 'comment' || type === 'reply') {
    notification = await Notification.findOne({
      type: [type, collection],
      secondUser: userId,
      documentId,
      'data.commentId': obj.commentId,
    });
  } else {
    notification = await Notification.findOne({
      type: [type, collection],
      secondUser: userId,
      documentId,
    });
  }

  const batchNotification = await Notification.findOne({
    type: [type, collection, 'batch'],
    documentId,
  });

  if (notification) await notification.deleteOne();

  if (batchNotification && !notification) {
    await Notification.findByIdAndUpdate(
      batchNotification._id,
      {
        $inc: { 'data.batchCount': -1 },
      },
      {
        runValidators: true,
      }
    );
  }
};

export const handleMentionNotifications = async (
  action: 'create' | 'delete',
  type: 'content' | 'reel' | 'comment',
  mentions: string[],
  user: { id: string; name: string },
  documentId: any,
  accessibility: ContentAccessibility | null,
  data: {} | null
) => {
  try {
    const { id, name } = user;

    const promises = mentions.map(async (username: string) => {
      if (username !== name) {
        const userExists = await User.findOne({ username });

        if (userExists) {
          const batchNotification = await Notification.findOne({
            user: userExists._id,
            type: { $all: ['mention', 'batch'] },
          });

          if (action === 'create') {
            const allowNotifications =
              userExists.settings.content.notifications.interactions.mentions;

            if (allowNotifications) {
              if (accessibility === ContentAccessibility.YOU) return;

              if (accessibility === ContentAccessibility.FRIENDS) {
                const isFriend = await Friend.findOne({
                  $or: [
                    { requester: id, recipient: userExists._id },
                    { requester: userExists._id, recipient: id },
                  ],
                });

                if (!isFriend) return;
              }

              const notifications = await Notification.find({
                user: userExists._id,
                type: {
                  $in: ['mention'],
                  $not: { $elemMatch: { $eq: 'batch' } },
                },
              }).sort('-createdAt');

              if (notifications.length >= 20 && !batchNotification) {
                // Deletes some previous notifications
                const deleteArray = notifications
                  .slice(4, notifications.length)
                  .map((data) => data._id);

                await Notification.create({
                  user: userExists._id,
                  type: ['mention', type],
                  secondUser: id,
                  documentId,
                  data,
                });

                await Notification.create({
                  user: userExists._id,
                  secondUser: notifications[4].secondUser,
                  type: ['mention', 'batch'],
                  data: {
                    batchCount: deleteArray.length - 1,
                  },
                });

                await Notification.deleteMany({
                  _id: { $in: deleteArray },
                });
              } else if (batchNotification) {
                await Notification.findByIdAndDelete(notifications[4]._id);

                await Notification.create({
                  user: userExists._id,
                  type: ['mention', type],
                  secondUser: id,
                  documentId,
                  data,
                });

                await Notification.findByIdAndUpdate(
                  batchNotification._id,
                  {
                    secondUser: notifications[4].secondUser,
                    $inc: { 'data.batchCount': 1 },
                  },
                  {
                    runValidators: true,
                  }
                );
              } else {
                await Notification.create({
                  user: userExists._id,
                  type: ['mention', type],
                  secondUser: id,
                  documentId,
                  data,
                });
              }
            }
          } else {
            const notification = await Notification.findOne({
              user: userExists._id,
              type: ['mention', type],
              secondUser: id,
              documentId,
            });

            if (notification) await notification.deleteOne();

            if (batchNotification && !notification) {
              await Notification.findByIdAndUpdate(
                batchNotification._id,
                {
                  $inc: { 'data.batchCount': -1 },
                },
                {
                  runValidators: true,
                }
              );
            }
          }
        }
      }
    });

    await Promise.allSettled(promises);
  } catch {}
};
