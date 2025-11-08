import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '../mongodb';

interface IUser {
  _id: mongoose.Types.ObjectId;
  userID: string;
  email: string;
  name: string;
  image?: string;
  displayName?: string;
  bio?: string;
  backgroundImage?: string;
  following: string[];
  followers: string[];
  provider: 'google' | 'github' | 'facebook';
  providerAccountId: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Alphanumeric + underscore only, case-sensitive
          return /^[a-zA-Z0-9_]+$/.test(v) && v.length >= 3 && v.length <= 20;
        },
        message: 'userID must be 3-20 characters, alphanumeric and underscore only, case-sensitive',
      },
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    displayName: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    backgroundImage: {
      type: String,
    },
    following: {
      type: [String],
      default: [],
    },
    followers: {
      type: [String],
      default: [],
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'github', 'facebook'],
    },
    providerAccountId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: userID already has unique: true in schema definition, which creates an index automatically
// Additional indexes can be created in MongoDB directly if needed for performance

let User: Model<IUser>;

try {
  User = mongoose.model<IUser>('User');
} catch {
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;
export type { IUser };

