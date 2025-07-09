import mongoose, { Schema, Document, Types } from 'mongoose';

interface IShare extends Document {
  user: Types.ObjectId;
  creator: Types.ObjectId;
  collectionName: String;
  documentId: Types.ObjectId;
  createdAt: Date;
}

const ShareSchema = new Schema<IShare>({
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
    enum: ['content', 'reel'],
    required: true,
  },
  documentId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Share = mongoose.model<IShare>('Share', ShareSchema);

export default Share;
