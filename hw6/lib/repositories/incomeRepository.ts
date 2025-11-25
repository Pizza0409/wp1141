import Income, { IIncome } from '@/lib/models/income';

export class IncomeRepository {
  async create(data: {
    userId: string;
    category: string;
    detail: string;
    amount: number;
    timestamp?: Date;
  }): Promise<IIncome> {
    const income = new Income({
      ...data,
      timestamp: data.timestamp || new Date(),
    });
    return income.save();
  }

  async findByUserId(
    userId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<IIncome[]> {
    return Income.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IIncome[]> {
    return Income.find({
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

    const incomes = await Income.find({
      userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    }).exec();

    const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const byCategory: Record<string, number> = {};

    incomes.forEach((inc) => {
      byCategory[inc.category] = (byCategory[inc.category] || 0) + inc.amount;
    });

    return { total, byCategory };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Income.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async updateById(
    id: string,
    data: Partial<{
      category: string;
      detail: string;
      amount: number;
      timestamp: Date;
    }>
  ): Promise<IIncome | null> {
    return Income.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  /**
   * 查詢所有使用者的收入記錄（用於管理後台）
   */
  async findAll(
    limit: number = 100,
    skip: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<IIncome[]> {
    const query: any = {};
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    return Income.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }
}

export default new IncomeRepository();
