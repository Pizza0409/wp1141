/**
 * Text parser utility to detect and convert:
 * - URLs to hyperlinks
 * - Hashtags (#tag) to clickable elements
 * - Mentions (@userID) to clickable profile links
 */

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const HASHTAG_REGEX = /#[\w]+/g;
const MENTION_REGEX = /@[\w]+/g;

export interface ParsedTextPart {
  type: 'text' | 'link' | 'hashtag' | 'mention';
  content: string;
  href?: string;
}

export function parseText(text: string): ParsedTextPart[] {
  const parts: ParsedTextPart[] = [];
  let lastIndex = 0;

  // Find all matches with their positions
  const matches: Array<{
    index: number;
    length: number;
    type: 'link' | 'hashtag' | 'mention';
    content: string;
  }> = [];

  // Find URLs
  let match: RegExpExecArray | null;
  while ((match = URL_REGEX.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'link',
      content: match[0],
    });
  }

  // Find hashtags (but not if they're part of a URL)
  URL_REGEX.lastIndex = 0;
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    // Check if this hashtag is part of a URL
    const isInUrl = matches.some(
      (m) =>
        m.type === 'link' &&
        match!.index >= m.index &&
        match!.index < m.index + m.length
    );
    if (!isInUrl) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'hashtag',
        content: match[0],
      });
    }
  }

  // Find mentions (but not if they're part of a URL)
  URL_REGEX.lastIndex = 0;
  HASHTAG_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    // Check if this mention is part of a URL or hashtag
    const isInUrl = matches.some(
      (m) =>
        (m.type === 'link' || m.type === 'hashtag') &&
        match!.index >= m.index &&
        match!.index < m.index + m.length
    );
    if (!isInUrl) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'mention',
        content: match[0],
      });
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build parts array
  matches.forEach((match) => {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add the match
    if (match.type === 'link') {
      parts.push({
        type: 'link',
        content: match.content,
        href: match.content,
      });
    } else if (match.type === 'hashtag') {
      // Extract hashtag text (remove #)
      const hashtagText = match.content.substring(1);
      parts.push({
        type: 'hashtag',
        content: match.content,
        href: `/hashtag/${encodeURIComponent(hashtagText)}`,
      });
    } else if (match.type === 'mention') {
      const userID = match.content.substring(1); // Remove @
      parts.push({
        type: 'mention',
        content: match.content,
        href: `/profile/${userID}`,
      });
    }

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

