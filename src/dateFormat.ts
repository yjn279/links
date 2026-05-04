/**
 * Format epoch milliseconds as a relative or absolute date string.
 * Uses the device's local timezone.
 *
 * Returns one of:
 *   "今日"  "昨日"  "N 日前"  "N 週間前"  "N か月前"  "YYYY/MM/DD"
 */
export function formatRelativeDate(epochMillis: number): string {
  const now = new Date();
  const target = new Date(epochMillis);

  // Compare calendar dates in local TZ (ignores time-of-day drift).
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  const diffMs = todayMidnight.getTime() - targetMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays} 日前`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} 週間前`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} か月前`;
  }

  // Fallback to YYYY/MM/DD
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}
