import mongoose, { Schema, Document, Types } from 'mongoose';

interface IFriend extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  createdAt: Date;
}

const FriendSchema = new Schema<IFriend>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Ensures a user cannot send multiple requests
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Friend = mongoose.model<IFriend>('Friend', FriendSchema);

export default Friend;
