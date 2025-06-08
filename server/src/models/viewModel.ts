import mongoose, { Schema, Document, Types } from 'mongoose';

interface IView extends Document {
  user: Types.ObjectId;
  collectionName: String;
  documentId: Types.ObjectId;
  createdAt: Date;
}

const ViewSchema = new Schema<IView>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collectionName: {
    type: String,
    enum: ['content', 'user', 'reel'],
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

const View = mongoose.model<IView>('View', ViewSchema);

export default View;
