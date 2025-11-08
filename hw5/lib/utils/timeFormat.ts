/**
 * Format date to relative time or absolute date
 * - Seconds/minutes/hours/days ago for recent posts
 * - Date format for older posts
 */

export function formatTime(date: Date | string): string {
  const now = new Date();
  const postDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - postDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs}s`;
  } else if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    // Format as date
    const month = postDate.toLocaleString('en-US', { month: 'short' });
    const day = postDate.getDate();
    const year = postDate.getFullYear();
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `${month} ${day}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
  }
}

