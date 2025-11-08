/**
 * Character counting utility with special rules:
 * - Links count as 23 characters regardless of length
 * - Hashtags (#tag) don't count toward character limit
 * - Mentions (@userID) don't count toward character limit
 */

export interface CharacterCountResult {
  textLength: number;
  linkCount: number;
  hashtags: string[];
  mentions: string[];
  isValid: boolean;
  totalCount: number; // textLength + (linkCount * 23)
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const HASHTAG_REGEX = /#[\w]+/g;
const MENTION_REGEX = /@[\w]+/g;

export function countCharacters(text: string): CharacterCountResult {
  // Extract URLs, hashtags, and mentions
  const urls = text.match(URL_REGEX) || [];
  const hashtags = text.match(HASHTAG_REGEX) || [];
  const mentions = text.match(MENTION_REGEX) || [];

  // Remove URLs, hashtags, and mentions from text for counting
  let textWithoutSpecial = text;
  
  // Remove URLs
  urls.forEach((url) => {
    textWithoutSpecial = textWithoutSpecial.replace(url, '');
  });
  
  // Remove hashtags
  hashtags.forEach((tag) => {
    textWithoutSpecial = textWithoutSpecial.replace(tag, '');
  });
  
  // Remove mentions
  mentions.forEach((mention) => {
    textWithoutSpecial = textWithoutSpecial.replace(mention, '');
  });

  // Count remaining characters (excluding spaces that were part of removed elements)
  const textLength = textWithoutSpecial.trim().length;
  const linkCount = urls.length;
  const totalCount = textLength + linkCount * 23;

  return {
    textLength,
    linkCount,
    hashtags: hashtags.map((tag) => tag.substring(1)), // Remove # symbol
    mentions: mentions.map((mention) => mention.substring(1)), // Remove @ symbol
    isValid: totalCount <= 280,
    totalCount,
  };
}

