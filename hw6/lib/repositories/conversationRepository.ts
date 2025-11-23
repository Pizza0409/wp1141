import Conversation, {
  IConversation,
  IConversationMessage,
} from '@/lib/models/conversation';

export class ConversationRepository {
  async findByUserId(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IConversation[]> {
    return Conversation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findLatestByUserId(userId: string): Promise<IConversation | null> {
    return Conversation.findOne({ userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async addMessage(
    userId: string,
    message: IConversationMessage
  ): Promise<IConversation> {
    // 嘗試找到最新的對話記錄
    let conversation = await this.findLatestByUserId(userId);

    // 如果沒有對話記錄或最後一條訊息超過 24 小時，建立新對話
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (
      !conversation ||
      (conversation.messages.length > 0 &&
        conversation.messages[conversation.messages.length - 1].timestamp <
          oneDayAgo)
    ) {
      conversation = new Conversation({
        userId,
        messages: [message],
      });
    } else {
      conversation.messages.push(message);
      conversation.updatedAt = now;
    }

    return conversation.save();
  }

  async getAllConversations(
    limit: number = 100,
    skip: number = 0
  ): Promise<IConversation[]> {
    return Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }
}

export default new ConversationRepository();


