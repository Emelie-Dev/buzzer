import mongoose, { Schema, Document, Types } from 'mongoose';

interface INotification extends Document {
  user: Types.ObjectId;
  type: String[];
  secondUser: Types.ObjectId;
  createdAt: Date;
}

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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

export default Notification;
