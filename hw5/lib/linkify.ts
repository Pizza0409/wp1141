import { find } from 'linkifyjs';

export interface LinkInfo {
  type: 'url' | 'hashtag' | 'mention';
  value: string;
  href: string;
  start: number;
  end: number;
}

export function detectLinks(text: string): LinkInfo[] {
  const links: LinkInfo[] = [];

  // Detect URLs using linkifyjs
  const urlLinks = find(text, 'url');
  urlLinks.forEach(link => {
    links.push({
      type: 'url',
      value: link.value,
      href: link.href,
      start: link.start,
      end: link.end,
    });
  });

  // Detect hashtags (#hashtag)
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    links.push({
      type: 'hashtag',
      value: match[0],
      href: `#${match[1]}`,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Detect mentions (@userID)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  while ((match = mentionRegex.exec(text)) !== null) {
    links.push({
      type: 'mention',
      value: match[0],
      href: `/profile/${match[1]}`,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Sort by start position
  return links.sort((a, b) => a.start - b.start);
}

export function countCharacters(text: string): number {
  const links = detectLinks(text);
  let count = text.length;
  
  // Subtract full length of URLs (they count as 23 chars)
  links.forEach(link => {
    if (link.type === 'url') {
      count -= (link.end - link.start);
      count += 23;
    }
    // Hashtags and mentions don't count, so subtract their length
    else if (link.type === 'hashtag' || link.type === 'mention') {
      count -= (link.end - link.start);
    }
  });
  
  return count;
}

export function formatTextWithLinks(text: string): string {
  const links = detectLinks(text);
  if (links.length === 0) return text;

  // Sort links by start position in reverse order to avoid index shifting
  const sortedLinks = [...links].sort((a, b) => b.start - a.start);
  
  let result = text;
  sortedLinks.forEach(link => {
    const before = result.slice(0, link.start);
    const after = result.slice(link.end);
    let replacement = '';
    
    if (link.type === 'url') {
      replacement = `<a href="${link.href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${link.value}</a>`;
    } else if (link.type === 'hashtag') {
      replacement = `<span class="text-blue-500">${link.value}</span>`;
    } else if (link.type === 'mention') {
      const userID = link.value.startsWith('@') ? link.value.slice(1) : link.value;
      replacement = `<a href="/profile/${userID}" class="text-blue-500 hover:underline">${link.value}</a>`;
    }
    
    result = before + replacement + after;
  });
  
  return result;
}

