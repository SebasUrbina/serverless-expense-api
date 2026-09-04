export type PlannedTransaction = {
  id: number;
  title: string;
  amount: number;
  date: string;
  recurring_rule_id: number | null;
};

export type PlannedRule = {
  id: number;
  title: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  next_run: string;
  end_date: string | null;
};

export type UpcomingPayment = {
  id: string;
  title: string;
  amount: number;
  date: string;
  source: 'transaction' | 'recurring';
};

const DAY = 86_400_000;
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function dateInTimezone(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function monthEnd(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}

// Match the scheduler's calendar semantics, without depending on server timezone.
export function nextOccurrence(
  rule: Pick<PlannedRule, 'frequency' | 'day_of_month'>,
  from: string,
): string {
  const date = new Date(`${from}T00:00:00Z`);
  switch (rule.frequency) {
    case 'daily':
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case 'weekly':
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case 'monthly':
      date.setUTCMonth(
        date.getUTCMonth() + 1,
        Math.max(1, Math.min(rule.day_of_month ?? Number(from.slice(8)), 28)),
      );
      break;
    case 'yearly':
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }
  return date.toISOString().slice(0, 10);
}

export function calculateAvailability(
  month: string,
  today: string,
  budget: number | null,
  transactions: PlannedTransaction[],
  rules: PlannedRule[],
) {
  const start = `${month}-01`;
  const end = monthEnd(month);
  const period = end < today ? 'past' : start > today ? 'future' : 'current';
  const inMonth = transactions.filter((t) => t.date >= start && t.date <= end);
  const spent = roundMoney(
    inMonth
      .filter((t) => t.date <= today)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  const payments: UpcomingPayment[] = inMonth
    .filter((t) => t.date > today)
    .map((t) => ({
      id: `transaction:${t.id}`,
      title: t.title,
      amount: t.amount,
      date: t.date,
      source: 'transaction',
    }));
  const recorded = new Set(
    inMonth
      .filter((t) => t.recurring_rule_id != null)
      .map((t) => `${t.recurring_rule_id}:${t.date}`),
  );

  // Historical months use recorded expenses only: current rules cannot reconstruct history.
  if (period !== 'past') {
    for (const rule of rules) {
      let date = rule.next_run;
      const until = rule.end_date && rule.end_date < end ? rule.end_date : end;
      if (
        date < start &&
        (rule.frequency === 'daily' || rule.frequency === 'weekly')
      ) {
        const step = rule.frequency === 'daily' ? DAY : 7 * DAY;
        const timestamp = Date.parse(`${date}T00:00:00Z`);
        date = new Date(
          timestamp +
            Math.ceil((Date.parse(`${start}T00:00:00Z`) - timestamp) / step) *
              step,
        )
          .toISOString()
          .slice(0, 10);
      }
      while (date <= until) {
        if (date >= start && !recorded.has(`${rule.id}:${date}`)) {
          payments.push({
            id: `recurring:${rule.id}:${date}`,
            title: rule.title,
            amount: rule.amount,
            date,
            source: 'recurring',
          });
        }
        const next = nextOccurrence(rule, date);
        if (next <= date) throw new Error('Recurring rule does not advance');
        date = next;
      }
    }
  }
  payments.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const committed = roundMoney(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
  );
  const remainingDays =
    period === 'past'
      ? 0
      : Math.round(
          (Date.parse(`${end}T00:00:00Z`) -
            Date.parse(`${period === 'future' ? start : today}T00:00:00Z`)) /
            DAY,
        ) + 1;
  const available =
    budget === null ? null : roundMoney(budget - spent - committed);

  return {
    month,
    as_of: today,
    period,
    budget,
    spent,
    committed,
    available,
    daily_available:
      available === null || remainingDays === 0
        ? null
        : Math.floor(Math.max(0, available) / remainingDays),
    remaining_days: remainingDays,
    payment_count: payments.length,
    payments,
  };
}
