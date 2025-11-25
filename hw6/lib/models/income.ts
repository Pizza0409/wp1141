import mongoose, { Document, Schema } from 'mongoose';

export interface IIncome extends Document {
  userId: string;
  category: string;
  detail: string;
  amount: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    detail: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 複合索引：使用者 + 時間戳，用於查詢特定使用者的記錄
IncomeSchema.index({ userId: 1, timestamp: -1 });

// 複合索引：使用者 + 類別 + 時間戳，用於統計查詢
IncomeSchema.index({ userId: 1, category: 1, timestamp: -1 });

const Income = mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);

export default Income;


