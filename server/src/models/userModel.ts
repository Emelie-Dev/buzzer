import mongoose, { Schema, Document, Query, Types } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import locationSubschema, {
  ILocation,
} from './subschemas/locationSubschema.js';
import settingsSubschema, {
  ISettings,
} from './subschemas/settingsSubschema.js';

export enum InboxSettings {
  EVERYONE,
  FRIENDS,
  FOLLOWERS,
  YOU,
}

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  bio: string;
  links: {
    website: string;
    youtube: string;
    instagram: string;
  };
  password: string;
  photo: string;
  active: boolean;
  emailVerified: boolean;
  emailVerificationToken: string | undefined;
  emailVerificationTokenExpires: Date | undefined;
  passwordChangedAt: Date;
  passwordResetToken: String | undefined;
  passwordResetTokenExpires: Date | undefined;
  passwordVerificationToken: String | undefined;
  passwordVerificationTokenExpires: Date | undefined;
  deactivateVerificationToken: String | undefined;
  deactivateVerificationTokenExpires: Date | undefined;
  deleteVerificationToken: String | undefined;
  deleteVerificationTokenExpires: Date | undefined;
  storyFeed: {
    feedExpires: Date;
    feed: Types.ObjectId[];
  };
  location: ILocation;
  searchHistory: String[];
  reelSounds: { name: string; src: string }[];
  settings: ISettings;
  pushSubscription: Object;
  createdAt: Date;
  generateToken: (type: 'email' | 'password') => string;
  comparePasswordInDb: (pswd: string, pswdDb: string) => Promise<boolean>;
  isPasswordChanged: (JWTTimestamp: number) => boolean;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    trim: true,
    required: [true, 'Please provide a value for the username.'],
    validate: {
      validator: (value) => {
        const name = validator.blacklist(value, '_');
        return validator.isAlphanumeric(name);
      },
      message:
        'Username must consist of letters, numbers, and underscores only.',
    },
    maxLength: [50, 'Username cannot exceed 50 characters.'],
  },
  name: {
    type: String,
    trim: true,
    maxLength: [30, 'Username cannot exceed 30 characters.'],
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    required: [true, 'Please provide a value for the email.'],
    validate: [validator.isEmail, 'Please provide a valid email.'],
  },
  bio: {
    type: String,
    trim: true,
  },
  links: {
    type: {
      website: String,
      youtube: String,
      instagram: String,
    },
    default: {
      website: '',
      youtube: '',
      instagram: '',
    },
  },
  password: {
    type: String,
    required: [true, 'Please provide a value for the password.'],
    validate: {
      validator: (value: string) => {
        return (
          Boolean(value.match(/\w/)) &&
          Boolean(value.match(/\d/)) &&
          !validator.isAlphanumeric(value)
        );
      },
      message: 'Password must consist of letter, digit, and special character.',
    },
    minLength: [8, 'Password must be above 8 characters.'],
  },
  photo: {
    type: String,
    default: 'default.jpeg',
  },
  active: {
    type: Boolean,
    default: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  storyFeed: {
    type: {
      feedExpires: Date,
      feed: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    default: {},
  },
  location: {
    type: locationSubschema,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  pushSubscription: {
    type: Object,
  },
  settings: {
    type: settingsSubschema,
    default: {},
  },
  searchHistory: {
    type: [String],
    default: [],
  },
  reelSounds: {
    type: [
      {
        name: String,
        src: String,
      },
    ],
    default: [],
  },
  passwordChangedAt: Date,
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  passwordVerificationToken: String,
  passwordVerificationTokenExpires: Date,
  deactivateVerificationToken: String,
  deactivateVerificationTokenExpires: Date,
  deleteVerificationToken: String,
  deleteVerificationTokenExpires: Date,
});

// Middlewares

// Encrypts Password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.pre(/^find/, function (this: Query<any, any>, next) {
  const filters = this.getFilter();

  if (filters.__login) {
    this.setQuery({ ...filters, __login: undefined });
  } else if (filters.emailVerificationToken) {
    this.where({ active: true });
  } else {
    this.where({ active: true, emailVerified: true });
  }

  next();
});

// Instance Methods

// Generates email verification token
UserSchema.methods.generateToken = function (type: 'email' | 'password') {
  const token = crypto.randomBytes(32).toString('hex');

  if (type === 'email') {
    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    this.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  } else {
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  }

  return token;
};

// Checks if provided password is correct
UserSchema.methods.comparePasswordInDb = async function (
  pswd: string,
  pswdDb: string
) {
  return await bcrypt.compare(pswd, pswdDb);
};

// Checks is password was changed
UserSchema.methods.isPasswordChanged = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      String(this.passwordChangedAt.getTime() / 1000),
      10
    );
    return JWTTimestamp < passwordChangedTimestamp;
  }

  return false;
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
