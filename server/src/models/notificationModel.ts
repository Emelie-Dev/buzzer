import mongoose, { Schema, Document, Types } from 'mongoose';

interface INotification extends Document {
  user: Types.ObjectId;
  type: String[];
  secondUser: Types.ObjectId;
  documentId: Types.ObjectId;
  data: any;
  createdAt: Date;
}

/* Post
    - Like user's post
    - comment on user's post
    - like user's comment
    - comments on user's comment

  Mentions (derive mentions from client)
    - user is mentioned in post description or comments

  Followers
    - user is followed

  Requests
    - receieves friend request
    - user's friend request accepted or rejected

  System
    - notifications about user's device or account
*/

const NotificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: [String],
    required: true,
  },
  secondUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  data: {
    type: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// NotificationSchema.index(
//   { type: 1, secondUser: 1, documentId: 1 },
//   { unique: true }
// );

const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

export default Notification;
