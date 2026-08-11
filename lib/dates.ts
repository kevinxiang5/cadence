/** Local calendar date helpers (timezone-safe for streaks). */

export function localTodayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function localYesterdayKey(d = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return localTodayKey(y);
}

export function localDayKeyFromDate(d: Date): string {
  return localTodayKey(d);
}
