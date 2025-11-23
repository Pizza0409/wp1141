import Expense, { IExpense } from '@/lib/models/expense';

export class ExpenseRepository {
  async create(data: {
    userId: string;
    category: string;
    detail: string;
    amount: number;
    timestamp?: Date;
  }): Promise<IExpense> {
    const expense = new Expense({
      ...data,
      timestamp: data.timestamp || new Date(),
    });
    return expense.save();
  }

  async findByUserId(
    userId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<IExpense[]> {
    return Expense.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IExpense[]> {
    return Expense.find({
      userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getMonthlyStatistics(
    userId: string,
    year: number,
    month: number
  ): Promise<{ total: number; byCategory: Record<string, number> }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await Expense.find({
      userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    }).exec();

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory: Record<string, number> = {};

    expenses.forEach((exp) => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });

    return { total, byCategory };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Expense.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}

export default new ExpenseRepository();


