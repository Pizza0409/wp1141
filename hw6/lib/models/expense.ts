import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  userId: string;
  category: string;
  detail: string;
  amount: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
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
ExpenseSchema.index({ userId: 1, timestamp: -1 });

// 複合索引：使用者 + 類別 + 時間戳，用於統計查詢
ExpenseSchema.index({ userId: 1, category: 1, timestamp: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;


