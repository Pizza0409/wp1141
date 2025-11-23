import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Line Bot AI 記帳系統
        </h1>
        <p className="text-lg text-gray-600 max-w-md">
          整合 Line Messaging API 的智慧記帳機器人，使用 OpenAI 解析自然語言記帳訊息。
        </p>
        <div className="flex gap-4">
          <Link
            href="/admin"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            管理後台
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            查看文件
          </a>
        </div>
      </main>
    </div>
  );
}
