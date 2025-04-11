import mongoose, { Schema, Document } from 'mongoose';

export enum StoryAccessibility {
  EVERYONE,
  FRIENDS,
  YOU,
}

export interface StoryItem extends Document {
  user: String;
  media: {
    src: String;
    mediaType: 'image' | 'video';
    filter: String;
  };
  disableComments: Boolean;
  accessibility: StoryAccessibility;
  sound: String;
  volume: {
    sound: Number;
    story: Number;
  };
  createdAt: Date;
}

export interface StoryFeedItem
  extends Omit<StoryItem, 'user' | 'createdAt' | 'accessibility'> {}

export const StorySchema = new Schema<StoryItem | StoryFeedItem>({
  user: {
    type: mongoose.Schema.ObjectId,
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
    default: StoryAccessibility.EVERYONE,
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
});

// Deletes each storyafter 24 hours
StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Story = mongoose.model('Story', StorySchema);

export default Story;
