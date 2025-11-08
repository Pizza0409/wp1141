# X-like Web Application

A Twitter/X-like social media application built with Next.js, NextAuth, MongoDB, and Tailwind CSS.

## Features

- **Authentication**: OAuth login with Google, GitHub, and Facebook
- **UserID System**: Custom userID registration and login
- **Session Management**: 7-day session expiration with auto-login
- **Post Creation**: Create and view posts (280 character limit)
- **User Profiles**: View user profiles and posts
- **Dark Theme**: Modern dark-themed UI matching X/Twitter design

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Real-time**: Pusher (configured, ready for future features)
- **Deployment**: Vercel

## Getting Started

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
   - MongoDB connection string
   - NextAuth secret (generate with: `openssl rand -base64 32`)
   - OAuth provider credentials (Google, GitHub, Facebook)
   - Pusher credentials (optional, for future real-time features)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env.local`

## UserID Rules

- 3-20 characters
- Alphanumeric characters and underscores only
- Case-sensitive
- Must be unique
- Different OAuth providers create different userIDs

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

Add all variables from `.env.local.example` to your Vercel project settings:
- `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` - Same secret as development
- `MONGODB_URI` - Your MongoDB connection string
- OAuth provider credentials
- Pusher credentials (if using)

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your IP address (or use 0.0.0.0/0 for Vercel)
4. Get your connection string and add to `MONGODB_URI`

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── posts/        # Post endpoints
│   │   └── user/         # User endpoints
│   ├── profile/          # Profile page
│   ├── post/             # Post creation page
│   ├── signin/           # Sign in page
│   ├── register-userid/  # UserID registration page
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── Sidebar.tsx       # Main navigation sidebar
│   └── SessionProvider.tsx
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── mongodb.ts        # MongoDB connection
│   └── models/           # Mongoose models
├── middleware.ts         # Route protection
└── types/                # TypeScript type definitions
```

## API Routes

### Authentication
- `POST /api/auth/register-userid` - Register userID for new OAuth user
- `POST /api/auth/login-userid` - Login with userID (uses NextAuth credentials)

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post (authenticated)

### User
- `GET /api/user/[userID]` - Get user by userID

## License

This project is for educational purposes.
