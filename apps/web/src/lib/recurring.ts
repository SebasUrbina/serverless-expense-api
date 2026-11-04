import { addDays, format, getISODay, parseISO } from 'date-fns';

/** The scheduler clamps monthly rules to day 28 so every month has the day. */
export const MAX_MONTH_DAY = 28;

const ymd = (date: Date) => format(date, 'yyyy-MM-dd');

/** Next date (today included) that falls on `day` of a month. */
export function nextMonthlyRun(day: number, today: string): string {
  const clamped = Math.max(1, Math.min(day, MAX_MONTH_DAY));
  const date = parseISO(today);
  const run = new Date(date.getFullYear(), date.getMonth(), clamped);
  if (clamped < date.getDate()) run.setMonth(run.getMonth() + 1);
  return ymd(run);
}

/** ISO weekday of a date: 1 = Monday … 7 = Sunday. */
export const weekdayOf = (date: string) => getISODay(parseISO(date));

/** Next date (today included) that falls on ISO `weekday`. */
export function nextWeekdayRun(weekday: number, today: string): string {
  const date = parseISO(today);
  return ymd(addDays(date, (weekday - getISODay(date) + 7) % 7));
}
