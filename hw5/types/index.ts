import { User, Post, Comment, Like, Repost, Follow, Draft } from '@prisma/client';

export type UserWithStats = User & {
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
};

export type PostWithAuthor = Post & {
  author: User;
  _count: {
    comments: number;
    likes: number;
    reposts: number;
  };
  liked?: boolean;
  reposted?: boolean;
};

export type CommentWithAuthor = Comment & {
  author: User;
  _count: {
    replies: number;
  };
  replies?: CommentWithAuthor[];
};

export type PostWithComments = PostWithAuthor & {
  comments: CommentWithAuthor[];
};

