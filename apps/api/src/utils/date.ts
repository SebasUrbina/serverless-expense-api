import { dateInTimezone } from '../services/monthlyAvailability';

// D1 runs in UTC, so date('now', 'localtime') would be "tomorrow" for users after 21:00 in Chile.
export const DEFAULT_TIMEZONE = 'America/Santiago';

export function todayLocal(now = new Date()): string {
  return dateInTimezone(now, DEFAULT_TIMEZONE);
}

/**
 * The last `count` months (YYYY-MM, oldest first) ending at `endMonth`, and
 * the date range that covers them. Never extends past today.
 */
export function monthWindow(
  count: number,
  endMonth?: string,
  today = todayLocal(),
) {
  const currentMonth = today.slice(0, 7);
  const lastMonth =
    endMonth && endMonth < currentMonth ? endMonth : currentMonth;
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(`${lastMonth}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  let end = today;
  if (lastMonth < currentMonth) {
    const d = new Date(`${lastMonth}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + 1, 0);
    end = d.toISOString().slice(0, 10);
  }
  return { months, start: `${months[0]}-01`, end };
}
