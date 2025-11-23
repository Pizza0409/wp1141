/**
 * Chatbot 測試腳本
 * 
 * 這個腳本可以用來測試 chatbot 的核心功能，包括：
 * - OpenAI API 連接測試
 * - 記帳訊息解析測試
 * - 對話回應生成測試
 * 
 * 使用方法：
 * 1. 確保 .env.local 已設定好 OPENAI_API_KEY
 * 2. 執行：npm run test:chatbot
 */

// 必須在導入任何模組之前載入環境變數
import { config } from 'dotenv';
import { resolve } from 'path';

// 載入 .env.local 檔案
const envResult = config({ path: resolve(process.cwd(), '.env.local') });

if (envResult.error) {
  console.warn('⚠️  無法載入 .env.local 檔案:', envResult.error.message);
}

// 確認環境變數已載入
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ 錯誤: 未找到 OPENAI_API_KEY 環境變數');
  console.error('請確認 .env.local 檔案存在且包含 OPENAI_API_KEY');
  process.exit(1);
}

// 現在才導入服務（此時環境變數已載入）
import openaiService from '../lib/services/openaiService';
import messageParser from '../lib/services/messageParser';

// 測試新格式的訊息解析（包含意圖識別）
async function testMessageParsing() {
  console.log('\n=== 測試訊息解析（新格式） ===\n');
  
  const testMessages = [
    { text: '午餐 50', expectedIntent: 'expense' },
    { text: '今天晚餐花了100元', expectedIntent: 'expense' },
    { text: '星巴克 120', expectedIntent: 'expense' },
    { text: '買了一台筆電 30000', expectedIntent: 'expense' },
    { text: '你好', expectedIntent: 'chat' },
    { text: '這個月花了多少', expectedIntent: 'query' },
    { text: '謝謝', expectedIntent: 'chat' },
  ];

  for (const { text, expectedIntent } of testMessages) {
    try {
      console.log(`測試訊息: "${text}"`);
      console.log(`  預期意圖: ${expectedIntent}`);
      
      // 使用新的統一解析方法
      const parsed = await openaiService.parseMessage(text);
      console.log(`  解析結果:`);
      console.log(`    - intent: ${parsed.intent} ${parsed.intent === expectedIntent ? '✅' : '⚠️'}`);
      console.log(`    - item: "${parsed.item}"`);
      console.log(`    - amount: ${parsed.amount}`);
      console.log(`    - category: "${parsed.category}"`);
      console.log(`    - reply: "${parsed.reply}"`);
      console.log(`  ✅ 成功解析\n`);
    } catch (error: any) {
      console.log(`  ❌ 錯誤: ${error.message}\n`);
    }
  }
}

// 測試對話回應生成
async function testResponseGeneration() {
  console.log('\n=== 測試對話回應生成 ===\n');
  
  const testMessages = [
    '你好',
    '這個月花了多少',
    '幫我記錄一下今天的支出',
    '謝謝',
  ];

  for (const message of testMessages) {
    try {
      console.log(`使用者訊息: "${message}"`);
      const response = await openaiService.generateResponse(message);
      console.log(`機器人回應: "${response}"`);
      console.log(`✅ 成功生成回應\n`);
    } catch (error: any) {
      console.log(`❌ 錯誤: ${error.message}\n`);
    }
  }
}

// 測試 OpenAI API 連接
async function testOpenAIConnection() {
  console.log('\n=== 測試 OpenAI API 連接 ===\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ 錯誤: 未設定 OPENAI_API_KEY 環境變數');
    console.log('請確認 .env.local 檔案中已設定 OPENAI_API_KEY\n');
    return false;
  }
  
  console.log('✅ OPENAI_API_KEY 已設定');
  console.log(`✅ 使用模型: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}\n`);
  
  try {
    // 簡單的測試請求
    const response = await openaiService.generateResponse('測試');
    console.log('✅ OpenAI API 連接成功');
    console.log(`測試回應: "${response}"\n`);
    return true;
  } catch (error: any) {
    console.log('❌ OpenAI API 連接失敗');
    console.log(`錯誤訊息: ${error.message}\n`);
    
    if (error.message.includes('配額') || error.message.includes('quota')) {
      console.log('💡 提示: 可能是 API 配額不足，請檢查 OpenAI 帳戶餘額');
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('💡 提示: API Key 可能無效，請檢查 .env.local 中的 OPENAI_API_KEY');
    }
    
    return false;
  }
}

// 主測試函數
async function main() {
  console.log('🤖 Chatbot 測試腳本');
  console.log('='.repeat(50));
  
  // 測試 OpenAI 連接
  const isConnected = await testOpenAIConnection();
  
  if (!isConnected) {
    console.log('⚠️  由於 OpenAI API 連接失敗，跳過其他測試');
    process.exit(1);
  }
  
  // 測試新格式的訊息解析（包含意圖識別）
  await testMessageParsing();
  
  // 測試對話回應生成（舊方法，用於對比）
  await testResponseGeneration();
  
  console.log('='.repeat(50));
  console.log('✅ 所有測試完成！');
  console.log('\n💡 注意事項：');
  console.log('   - 每次調用 OpenAI API 都會消耗 credit');
  console.log('   - 使用 gpt-3.5-turbo 模型較為經濟實惠');
  console.log('   - 可以在 OpenAI Dashboard 查看使用量和費用\n');
}

// 執行測試
main().catch((error) => {
  console.error('測試執行失敗:', error);
  process.exit(1);
});

