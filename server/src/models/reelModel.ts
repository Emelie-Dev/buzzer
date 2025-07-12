import mongoose, { Schema, Document, Types } from 'mongoose';
import locationSubschema, {
  ILocation,
} from './subschemas/locationSubschema.js';
import { ContentAccessibility } from './storyModel.js';

interface IReel extends Document {
  user: Types.ObjectId;
  src: String;
  description: String;
  collaborators: Types.ObjectId[];
  location: ILocation;
  keywords: String[];
  playTime: Number;
  watchedFully: Number;
  settings: {
    accessibility: Number;
    disableComments: Boolean;
    hideEngagements: Boolean;
  };
  createdAt: Date;
}

const ReelSchema = new Schema<IReel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  src: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: 2200,
    trim: true,
    default: '',
  },
  keywords: {
    type: [String],
    default: [],
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

const Reel = mongoose.model<IReel>('Reel', ReelSchema);

export default Reel;
