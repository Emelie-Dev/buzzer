import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILike extends Document {
  user: Types.ObjectId;
  creator: Types.ObjectId;
  collectionName: String;
  documentId: Types.ObjectId;
  likedAt: Date;
}

const LikeSchema = new Schema<ILike>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collectionName: {
    type: String,
    enum: ['story', 'content', 'comment', 'reel'],
    required: true,
  },
  documentId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  likedAt: {
    type: Date,
    default: Date.now,
  },
});

LikeSchema.index(
  { user: 1, collectionName: 1, documentId: 1 },
  { unique: true }
);

const Like = mongoose.model<ILike>('Like', LikeSchema);

export default Like;
