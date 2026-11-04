import assert from 'node:assert/strict';
import { test } from 'node:test';
import { format } from 'date-fns';
import { monthGrid, recentDates } from './calendar';

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

test('month grid starts on Monday and covers whole weeks', () => {
  // October 2026 starts on a Thursday and ends on a Saturday.
  const days = monthGrid(new Date(2026, 9, 15));
  assert.equal(ymd(days[0]!), '2026-09-28');
  assert.equal(ymd(days.at(-1)!), '2026-11-01');
  assert.equal(days.length % 7, 0);
});

test('recent dates cross month boundaries', () => {
  assert.deepEqual(recentDates(new Date(2026, 10, 1)), [
    '2026-11-01',
    '2026-10-31',
    '2026-10-30',
  ]);
});
