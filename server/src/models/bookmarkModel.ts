import mongoose, { Document, Schema, Types } from 'mongoose';

interface IBookmark extends Document {
  user: Types.ObjectId;
  collectionName: String;
  documentId: Types.ObjectId;
  savedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  user: {
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
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

BookmarkSchema.index(
  { user: 1, collectionName: 1, documentId: 1 },
  { unique: true }
);

const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

export default Bookmark;
