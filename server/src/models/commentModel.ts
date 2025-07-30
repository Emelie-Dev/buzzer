import mongoose, { Schema, Document, Types } from 'mongoose';

interface IComment extends Document {
  user: Types.ObjectId;
  creator: Types.ObjectId;
  collectionName: String;
  documentId: Types.ObjectId;
  createdAt: Date;
  reply: {
    receiver: Types.ObjectId;
    commentId: Types.ObjectId;
  };
  text: String;
}

const CommentSchema = new Schema<IComment>({
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
    enum: ['content'],
    required: true,
  },
  documentId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  reply: {
    type: {
      receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: true,
      },
    },
  },
  text: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
