export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Just now';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatDomain(urlOrDomain: string): string {
  if (!urlOrDomain) return 'Unknown Website';
  try {
    const url = new URL(urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`);
    return url.hostname;
  } catch {
    return urlOrDomain.replace(/^https?:\/\//i, '').split('/')[0];
  }
}
