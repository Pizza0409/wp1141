import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '../mongodb';

interface IDraft {
  _id: mongoose.Types.ObjectId;
  userID: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const DraftSchema = new Schema<IDraft>(
  {
    userID: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DraftSchema.index({ userID: 1, createdAt: -1 });

let Draft: Model<IDraft>;

try {
  Draft = mongoose.model<IDraft>('Draft');
} catch {
  Draft = mongoose.model<IDraft>('Draft', DraftSchema);
}

export default Draft;
export type { IDraft };

