import mongoose, { Schema, Document, Types } from 'mongoose';

interface IFollow extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  followedAt: Date;
}

const FollowSchema = new Schema<IFollow>({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  followedAt: {
    type: Date,
    default: Date.now,
  },
});

// Creating a unique index for fast lookup
// Ensures a user cannot follow the same user multiple times
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model<IFollow>('Follow', FollowSchema);

export default Follow;
