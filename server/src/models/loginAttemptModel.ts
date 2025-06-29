import mongoose, { Schema, Document } from 'mongoose';

interface ILoginAttempt extends Document {
  email: string;
  deviceId: string;
  count: number;
  blocked: Boolean;
  expiresAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>({
  email: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

const LoginAttempt = mongoose.model<ILoginAttempt>(
  'LoginAttempt',
  LoginAttemptSchema
);

export default LoginAttempt;
