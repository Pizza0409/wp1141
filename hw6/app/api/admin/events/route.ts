import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import conversationRepository from '@/lib/repositories/conversationRepository';
import logger from '@/lib/services/logger';

// Server-Sent Events 端點，用於即時更新
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        const message = `data: ${data}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 發送初始連接訊息
      sendEvent(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

      // 定期檢查新訊息（每 5 秒）
      const interval = setInterval(async () => {
        try {
          await connectDB();
          
          // 取得最新的對話記錄（最近 1 分鐘內更新的）
          const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
          const conversations = await conversationRepository.getAllConversations(10, 0);
          
          const recentConversations = conversations.filter(
            (conv) => new Date(conv.updatedAt) > oneMinuteAgo
          );

          if (recentConversations.length > 0) {
            sendEvent(
              JSON.stringify({
                type: 'new_conversations',
                data: recentConversations,
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch (error: any) {
          logger.error('SSE 檢查新訊息失敗', { error: error.message });
        }
      }, 5000);

      // 當客戶端斷開連接時清理
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


