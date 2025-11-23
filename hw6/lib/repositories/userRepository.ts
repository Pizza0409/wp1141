import User, { IUser } from '@/lib/models/user';

export class UserRepository {
  async findByLineUserId(lineUserId: string): Promise<IUser | null> {
    return User.findOne({ lineUserId }).exec();
  }

  async createOrUpdate(data: {
    lineUserId: string;
    displayName?: string;
  }): Promise<IUser> {
    return User.findOneAndUpdate(
      { lineUserId: data.lineUserId },
      {
        lineUserId: data.lineUserId,
        displayName: data.displayName,
        $setOnInsert: { customCategories: [] },
      },
      { upsert: true, new: true }
    ).exec();
  }

  async addCustomCategory(
    lineUserId: string,
    category: string
  ): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { lineUserId },
      { $addToSet: { customCategories: category } },
      { new: true }
    ).exec();
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.find().exec();
  }
}

export default new UserRepository();


