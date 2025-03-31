import mongoose, { Schema, Document } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password: string;
  photo: string;
  active: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string | undefined;
  emailVerificationTokenExpires?: Date | undefined;
  generateToken: () => string;
}

const userSchema = new Schema<IUser>({
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
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
});

// Encrypts Password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

// Generates email verification token
userSchema.methods.generateToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
