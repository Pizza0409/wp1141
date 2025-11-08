import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '../mongodb';

interface ILike {
  _id: mongoose.Types.ObjectId;
  userID: string;
  postID: string;
  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    userID: {
      type: String,
      required: true,
    },
    postID: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure one like per user per post
LikeSchema.index({ userID: 1, postID: 1 }, { unique: true });

let Like: Model<ILike>;

try {
  Like = mongoose.model<ILike>('Like');
} catch {
  Like = mongoose.model<ILike>('Like', LikeSchema);
}

export default Like;
export type { ILike };

