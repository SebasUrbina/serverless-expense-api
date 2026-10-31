import { dateInTimezone } from '../services/monthlyAvailability';

// D1 runs in UTC, so date('now', 'localtime') would be "tomorrow" for users after 21:00 in Chile.
export const DEFAULT_TIMEZONE = 'America/Santiago';

export function todayLocal(now = new Date()): string {
  return dateInTimezone(now, DEFAULT_TIMEZONE);
}
