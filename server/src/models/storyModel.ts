import mongoose, { Schema, Document, Types } from 'mongoose';

export enum ContentAccessibility {
  EVERYONE,
  FRIENDS,
  YOU,
}

export interface StoryItem extends Document {
  user: Types.ObjectId;
  media: {
    src: String;
    mediaType: 'image' | 'video';
    filter: String;
  };
  disableComments: Boolean;
  accessibility: ContentAccessibility;
  sound: String;
  volume: {
    sound: Number;
    story: Number;
  };
  createdAt: Date;
  expired: boolean;
}

export interface StoryFeedItem
  extends Omit<StoryItem, 'user' | 'createdAt' | 'accessibility'> {}

export const StorySchema = new Schema<StoryItem | StoryFeedItem>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  media: {
    type: {
      src: {
        type: String,
        required: true,
      },
      mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true,
      },
      filter: {
        type: String,
        required: true,
      },
    },
  },
  disableComments: {
    type: Boolean,
    default: false,
  },
  accessibility: {
    type: Number,
    default: ContentAccessibility.EVERYONE,
  },
  sound: String,
  volume: {
    type: {
      sound: {
        type: Number,
        default: 0.5,
      },
      story: {
        type: Number,
        default: 1,
      },
    },
  },
  createdAt: { type: Date, default: Date.now },
  expired: { type: Boolean, default: false },
});

StorySchema.index({ expired: 1, createdAt: 1 });

const Story = mongoose.model<StoryItem | StoryFeedItem>('Story', StorySchema);

export default Story;
