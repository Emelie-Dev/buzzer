import { Document, Schema, Types } from 'mongoose';

enum InboxSettings {
  EVERYONE,
  FRIENDS,
  FOLLOWERS,
  YOU,
}

export interface ISettings extends Document {
  general: {
    hiddenStories: Types.ObjectId[];
    display: String;
    inbox: InboxSettings;
    privacy: {
      value: Boolean;
      users: Types.ObjectId[];
    };
    suggestionBlacklist: Types.ObjectId[];
  };
  account: {
    emailVisibility: Boolean;
  };
  security: {
    sessions: {
      name: string;
      type: string;
      loginMethod: string;
      jwi: string;
      createdAt: Date;
      lastUsed: Date;
    }[];
  };
  content: {
    notInterested: {
      content: Types.ObjectId[];
      reels: String[];
    };
    notifications: {
      push: Boolean;
      email: Boolean;
      interactions: {
        likes: Boolean;
        comments: Boolean;
        followers: Boolean;
        mentions: Boolean;
        profileViews: Boolean;
        messages: Boolean;
      };
    };
    timeManagement: {
      dailyLimit: {
        enabled: Boolean;
        value: Number;
        notified: Boolean;
      };
      scrollBreak: {
        enabled: Boolean;
        value: Number;
      };
      sleepReminders: {
        enabled: Boolean;
        value: {
          startTime: Number;
          endTime: Number;
          days: Number[];
        };
        notified: Boolean;
      };
      summary: {};
    };
  };
}

export default new Schema<ISettings>({
  general: {
    hiddenStories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    display: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    inbox: {
      type: Number,
      default: InboxSettings.EVERYONE,
    },
    privacy: {
      value: { type: Boolean, default: false },
      users: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    suggestionBlacklist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  account: {
    emailVisibility: { type: Boolean, default: false },
  },
  security: {
    sessions: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        loginMethod: {
          type: String,
          enum: ['email', 'google', 'facebook'],
          required: true,
        },
        jwi: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date, default: Date.now },
      },
    ],
  },
  content: {
    notInterested: {
      content: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      reels: [String],
    },
    notifications: {
      push: { type: Boolean, default: false },
      email: { type: Boolean, default: true },
      interactions: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        followers: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        profileViews: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
    },
    timeManagement: {
      dailyLimit: {
        enabled: { type: Boolean, default: false },
        value: { type: Number, min: 10, max: 410, default: 120 },
        notified: { type: Boolean, default: false },
      },
      scrollBreak: {
        enabled: { type: Boolean, default: false },
        value: { type: Number, min: 5, max: 120, default: 60 },
      },
      sleepReminders: {
        enabled: { type: Boolean, default: false },
        value: {
          startTime: { type: Number, min: 19, max: 22, default: 20 },
          endTime: { type: Number, min: 4, max: 7, default: 5 },
          days: [{ type: Number, min: 0, max: 6 }],
        },
        notified: { type: Boolean, default: false },
      },
      summary: { type: Object, default: {} },
    },
  },
});
