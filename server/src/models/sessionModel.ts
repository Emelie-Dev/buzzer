import mongoose, { Document, Schema, Types } from 'mongoose';

interface ISession extends Document {
  user: Types.ObjectId;
  deviceName: string;
  deviceId: string;
  platform: string;
  loginMethod: string;
  createdAt: Date;
  lastUsedAt: Date;
  revokedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  deviceName: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  loginMethod: {
    type: String,
    enum: ['email', 'google', 'facebook'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
  revokedAt: {
    type: Date,
  },
});

// Create Indexes
SessionSchema.index(
  { user: 1, deviceId: 1, revokedAt: 1 },
  { unique: true, partialFilterExpression: { revokedAt: null } }
);
SessionSchema.index({ user: 1, revokedAt: 1, lastUsedAt: -1 });

const Session = mongoose.model<ISession>('Session', SessionSchema);

export default Session;
