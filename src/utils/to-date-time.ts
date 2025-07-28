export function toDateTime(secs: number) {
  var t = new Date('1970-01-01T00:30:00Z'); // Unix epoch start.
  t.setSeconds(secs);
  return t;
}

/**
 * Format date consistently for both server and client to avoid hydration mismatches
 * Uses en-US locale with explicit options to ensure consistent formatting
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC' // Use UTC to avoid timezone differences between server/client
  });
}
