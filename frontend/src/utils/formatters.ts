export function truncateHash(hash?: string, lead = 8, trail = 6): string {
  if (!hash) return '—';
  if (hash.length <= lead + trail) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
}

export function formatTimestamp(isoOrEpoch?: string | number): string {
  if (!isoOrEpoch) return '—';
  try {
    const d = typeof isoOrEpoch === 'number' ? new Date(isoOrEpoch * 1000) : new Date(isoOrEpoch);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return String(isoOrEpoch);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
