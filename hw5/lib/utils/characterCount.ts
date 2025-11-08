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
  if (!text || text.length === 0) {
    return {
      textLength: 0,
      linkCount: 0,
      hashtags: [],
      mentions: [],
      isValid: true,
      totalCount: 0,
    };
  }

  // Extract URLs, hashtags, and mentions
  const urls = text.match(URL_REGEX) || [];
  const hashtags = text.match(HASHTAG_REGEX) || [];
  const mentions = text.match(MENTION_REGEX) || [];

  // Create a set of all special patterns to remove
  const specialPatterns: Array<{ pattern: string; start: number; end: number }> = [];
  
  // Add URLs
  urls.forEach((url) => {
    const index = text.indexOf(url);
    if (index !== -1) {
      specialPatterns.push({
        pattern: url,
        start: index,
        end: index + url.length,
      });
    }
  });
  
  // Add hashtags (if not part of URL)
  hashtags.forEach((tag) => {
    const index = text.indexOf(tag);
    if (index !== -1) {
      const isInUrl = specialPatterns.some(
        (sp) => index >= sp.start && index < sp.end
      );
      if (!isInUrl) {
        specialPatterns.push({
          pattern: tag,
          start: index,
          end: index + tag.length,
        });
      }
    }
  });
  
  // Add mentions (if not part of URL)
  mentions.forEach((mention) => {
    const index = text.indexOf(mention);
    if (index !== -1) {
      const isInUrl = specialPatterns.some(
        (sp) => index >= sp.start && index < sp.end
      );
      if (!isInUrl) {
        specialPatterns.push({
          pattern: mention,
          start: index,
          end: index + mention.length,
        });
      }
    }
  });

  // Sort by start position (descending) to remove from end to start
  specialPatterns.sort((a, b) => b.start - a.start);
  
  // Remove special patterns from text
  let textWithoutSpecial = text;
  specialPatterns.forEach((sp) => {
    textWithoutSpecial =
      textWithoutSpecial.substring(0, sp.start) +
      textWithoutSpecial.substring(sp.end);
  });

  // Count remaining characters
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

