import mongoose, { Schema, Document, Types } from 'mongoose';
import { ContentAccessibility } from './storyModel.js';
import locationSubschema, {
  ILocation,
} from './subschemas/locationSubschema.js';

interface IContentItem extends Document {
  src: string;
  mediaType: 'image' | 'video';
  description: string;
  filter: string;
}

interface IContent extends Document {
  user: Types.ObjectId;
  media: IContentItem[];
  aspectRatio: Number;
  description: String;
  collaborators: Types.ObjectId[];
  location: ILocation;
  playTime: Number;
  watchedFully: Number;
  settings: {
    accessibility: Number;
    disableComments: Boolean;
    hideEngagements: Boolean;
  };
  createdAt: Date;
}

const ContentItemSchema = new Schema<IContentItem>({
  src: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  description: {
    type: String,
    maxlength: 800,
    trim: true,
  },
  filter: { type: String, required: true },
});

const ContentSchema = new Schema<IContent>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  media: {
    type: [ContentItemSchema],
    required: true,
    validate: {
      validator: (value: IContentItem[]) => {
        return value.length <= 20;
      },
      message: 'You can only upload 20 files at once!',
    },
  },
  aspectRatio: {
    type: Number,
    enum: [1, 0.8, 1.7778, 0],
    default: 0,
  },
  description: {
    type: String,
    maxlength: 2200,
    trim: true,
    default: '',
  },
  collaborators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  location: {
    type: locationSubschema,
    required: true,
  },
  playTime: {
    type: Number,
    default: 0,
  },
  watchedFully: {
    type: Number,
    default: 0,
  },
  settings: {
    type: {
      accessibility: Number,
      disableComments: Boolean,
      hideEngagements: Boolean,
    },
    default: {
      accessibility: ContentAccessibility.EVERYONE,
      disableComments: false,
      hideEngagements: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Content = mongoose.model<IContent>('Content', ContentSchema);

export default Content;
