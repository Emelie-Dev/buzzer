import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  user: String;
  collectionName: String;
  documentId: String;
  likedAt: Date;
}

const LikeSchema = new Schema<ILike>({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  collectionName: {
    type: String,
    enum: ['story'],
    required: true,
  },
  documentId: {
    type: mongoose.Schema.ObjectId,
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

const Like = mongoose.model('Like', LikeSchema);

export default Like;
