# X-like Web Application

A Twitter/X-like social media application built with Next.js, NextAuth, MongoDB, and Tailwind CSS.

## 🌐 Deployed Link

**Production URL:** [https://my-335xc77ju-yun-sheng-los-projects.vercel.app](https://my-335xc77ju-yun-sheng-los-projects.vercel.app)

## 🔐 安全性措施 (Security Measures)

### 註冊金鑰 (Registration Key)

為了防止任意路人註冊，本應用程式需要註冊金鑰才能完成註冊。

**REG_KEY:** `hw5-ntu-wp1141-2024-registration-key-xyz123`

> ⚠️ **注意**: 此金鑰僅供作業評分使用，請勿用於生產環境。

### 安全功能

- **OAuth 驗證**: 所有登入必須通過 OAuth 提供商（Google、GitHub、Facebook）
- **UserID 登入保護**: 使用 UserID 登入時，系統會驗證該 UserID 註冊時使用的 OAuth 帳號，防止未授權登入
- **Session 管理**: 7 天自動過期，使用 JWT 策略
- **Email 驗證**: 登入時驗證 OAuth 帳號的 email 是否匹配

## ✨ 功能清單 (Features)

### 基礎功能 (Basic Features)

- ✅ **OAuth 登入**: 支援 Google、GitHub、Facebook 三種 OAuth 提供商
- ✅ **UserID 系統**: 自訂 UserID 註冊和登入
  - UserID 規則：3-20 字元，僅允許英數字和底線，區分大小寫
  - 使用 UserID 登入時會自動跳轉到註冊時使用的 OAuth 提供商
- ✅ **發文功能**: 建立和查看貼文（280 字元限制）
- ✅ **使用者資料**: 查看使用者資料和貼文
- ✅ **深色主題**: 現代化深色主題 UI，符合 X/Twitter 設計風格

### 進階功能 (Advanced Features)

- ✅ **評論系統**: 對貼文進行評論和回覆
- ✅ **按讚功能**: 對貼文按讚/取消按讚
- ✅ **轉發功能**: 轉發其他使用者的貼文
- ✅ **關注系統**: 關注/取消關注其他使用者
- ✅ **Hashtag 支援**: 支援 Hashtag 標籤和搜尋
- ✅ **草稿功能**: 儲存和編輯草稿
- ✅ **動態篩選**: 首頁支援「全部」和「關注中」兩種篩選模式
- ✅ **使用者個人頁面**: 
  - 查看使用者的貼文和按讚的貼文
  - 顯示關注者/追蹤中數量
  - 編輯個人資料（顯示名稱、簡介、背景圖片）
- ✅ **安全性增強**:
  - UserID 登入時驗證 OAuth 帳號匹配
  - 防止使用不同 OAuth 帳號登入已註冊的 email

## 🛠 Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Real-time**: Pusher (configured, ready for future features)
- **Deployment**: Vercel

## 📋 架構圖 (Architecture Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Home   │  │ Profile  │  │   Post   │  │  SignIn  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │      Next.js API Routes            │
        │  ┌──────────────────────────────┐  │
        │  │  /api/auth/[...nextauth]     │  │
        │  │  /api/auth/register-userid   │  │
        │  │  /api/auth/check-userid      │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │  /api/posts                   │  │
        │  │  /api/posts/[postID]/like     │  │
        │  │  /api/posts/[postID]/repost   │  │
        │  │  /api/posts/[postID]/comments │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │  /api/user/[userID]           │  │
        │  │  /api/user/[userID]/follow    │  │
        │  │  /api/user/[userID]/posts     │  │
        │  │  /api/user/[userID]/likes     │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │  /api/hashtag/[hashtag]      │  │
        │  │  /api/drafts                 │  │
        │  └──────────────────────────────┘  │
        └─────────────────┬───────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │      NextAuth.js v5                │
        │  ┌──────────┐  ┌──────────┐       │
        │  │  Google  │  │  GitHub  │       │
        │  └──────────┘  └──────────┘       │
        │  ┌──────────┐                     │
        │  │ Facebook │                     │
        │  └──────────┘                     │
        └─────────────────┬───────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │      MongoDB (Mongoose)            │
        │  ┌──────────┐  ┌──────────┐       │
        │  │  Users   │  │  Posts   │       │
        │  └──────────┘  └──────────┘       │
        │  ┌──────────┐  ┌──────────┐       │
        │  │  Likes   │  │  Drafts  │       │
        │  └──────────┘  └──────────┘       │
        └────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or MongoDB Atlas)
- OAuth app credentials (Google, GitHub, Facebook)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hw5
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local` file with:
   - `MONGODB_URI` - MongoDB connection string
   - `NEXTAUTH_SECRET` - NextAuth secret (generate with: `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` - Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `GITHUB_CLIENT_ID` - GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET` - GitHub OAuth Client Secret
   - `FACEBOOK_CLIENT_ID` - Facebook OAuth App ID
   - `FACEBOOK_CLIENT_SECRET` - Facebook OAuth App Secret

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: 
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://your-domain.vercel.app/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://your-domain.vercel.app/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env.local`

## 📝 UserID Rules

- 3-20 characters
- Alphanumeric characters and underscores only (`[a-zA-Z0-9_]`)
- Case-sensitive
- Must be unique
- Each OAuth provider account can only register one UserID

## 🚢 Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

Add all variables from `.env.local` to your Vercel project settings:
- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Same secret as development (or let NextAuth auto-detect with `trustHost: true`)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GITHUB_CLIENT_ID` - GitHub OAuth Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth Client Secret
- `FACEBOOK_CLIENT_ID` - Facebook OAuth App ID
- `FACEBOOK_CLIENT_SECRET` - Facebook OAuth App Secret

> **Note**: `NEXTAUTH_URL` is optional when `trustHost: true` is set in NextAuth config. Vercel will automatically provide the correct URL.

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your IP address (use `0.0.0.0/0` for Vercel to allow all IPs)
4. Get your connection string and add to `MONGODB_URI`

## 📁 Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── [...nextauth]/  # NextAuth handler
│   │   │   ├── check-userid/   # Check UserID and get provider
│   │   │   ├── register-userid/# Register UserID
│   │   │   └── session/        # Session endpoint
│   │   ├── posts/              # Post endpoints
│   │   │   ├── [postID]/       # Individual post operations
│   │   │   │   ├── comments/   # Comments on post
│   │   │   │   ├── like/       # Like/unlike post
│   │   │   │   └── repost/     # Repost post
│   │   │   └── route.ts        # List/create posts
│   │   ├── user/               # User endpoints
│   │   │   └── [userID]/       # User-specific operations
│   │   │       ├── follow/     # Follow/unfollow user
│   │   │       ├── likes/      # User's liked posts
│   │   │       └── posts/      # User's posts
│   │   ├── hashtag/            # Hashtag endpoints
│   │   │   └── [hashtag]/      # Get posts by hashtag
│   │   └── drafts/             # Draft endpoints
│   ├── profile/                # Profile pages
│   ├── post/                   # Post detail page
│   ├── signin/                 # Sign in page
│   ├── register-userid/        # UserID registration page
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── Sidebar.tsx             # Main navigation sidebar
│   ├── Post.tsx               # Post component
│   ├── Comment.tsx            # Comment component
│   ├── PostModal.tsx          # Post creation modal
│   ├── InlinePostCreator.tsx  # Inline post creator
│   ├── DraftsList.tsx         # Drafts list component
│   └── SessionProvider.tsx    # Session context provider
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   ├── mongodb.ts             # MongoDB connection
│   └── models/                # Mongoose models
│       ├── User.ts            # User model
│       ├── Like.ts            # Like model
│       └── Draft.ts           # Draft model
├── types/                      # TypeScript type definitions
└── proxy.ts                    # Middleware for route protection
```

## 🔌 API Routes

### Authentication
- `POST /api/auth/register-userid` - Register UserID for new OAuth user
- `POST /api/auth/check-userid` - Check if UserID exists and get provider info
- `GET /api/auth/session` - Get current session

### Posts
- `GET /api/posts` - Get all posts (supports `filter=following` query)
- `POST /api/posts` - Create a new post (authenticated, 280 char limit)
- `GET /api/posts/[postID]` - Get post by ID
- `PUT /api/posts/[postID]` - Update post (author only)
- `DELETE /api/posts/[postID]` - Delete post (author only)
- `POST /api/posts/[postID]/like` - Like/unlike a post
- `POST /api/posts/[postID]/repost` - Repost a post
- `GET /api/posts/[postID]/comments` - Get comments on a post
- `POST /api/posts/[postID]/comments` - Add a comment to a post

### User
- `GET /api/user/[userID]` - Get user profile by UserID
- `PUT /api/user/[userID]` - Update user profile (authenticated, own profile only)
- `POST /api/user/[userID]/follow` - Follow/unfollow a user
- `GET /api/user/[userID]/posts` - Get user's posts
- `GET /api/user/[userID]/likes` - Get user's liked posts

### Hashtag
- `GET /api/hashtag/[hashtag]` - Get posts containing a specific hashtag

### Drafts
- `GET /api/drafts` - Get user's drafts (authenticated)
- `POST /api/drafts` - Create a draft (authenticated)
- `GET /api/drafts/[draftID]` - Get draft by ID
- `PUT /api/drafts/[draftID]` - Update draft
- `DELETE /api/drafts/[draftID]` - Delete draft

## 🔒 Security Features

1. **OAuth-only Authentication**: All logins must go through OAuth providers
2. **UserID Login Protection**: When logging in with UserID, system verifies the OAuth account matches
3. **Email Verification**: Prevents using different OAuth accounts to login with registered emails
4. **Session Management**: JWT-based sessions with 7-day expiration
5. **Route Protection**: Middleware protects routes requiring authentication

## 📄 License

This project is for educational purposes.
