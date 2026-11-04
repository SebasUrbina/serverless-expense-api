import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK = { weekStartsOn: 1 } as const;

/** Every day shown in a Monday-first month grid, padded to whole weeks. */
export function monthGrid(month: Date): Date[] {
  const days: Date[] = [];
  const last = endOfWeek(endOfMonth(month), WEEK);
  for (
    let day = startOfWeek(startOfMonth(month), WEEK);
    day <= last;
    day = addDays(day, 1)
  ) {
    days.push(day);
  }
  return days;
}

/** Today, yesterday and the day before, as YYYY-MM-DD. */
export function recentDates(today: Date): string[] {
  return [0, 1, 2].map((n) => format(addDays(today, -n), 'yyyy-MM-dd'));
}
