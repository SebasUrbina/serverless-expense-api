import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextMonthlyRun, nextWeekdayRun, weekdayOf } from './recurring';

test('monthly run stays in this month while the day has not passed', () => {
  assert.equal(nextMonthlyRun(15, '2026-11-03'), '2026-11-15');
  assert.equal(nextMonthlyRun(3, '2026-11-03'), '2026-11-03');
});

test('monthly run moves to next month, across years, and clamps to 28', () => {
  assert.equal(nextMonthlyRun(1, '2026-12-03'), '2027-01-01');
  assert.equal(nextMonthlyRun(31, '2026-02-01'), '2026-02-28');
});

test('weekly run finds the next matching weekday, today included', () => {
  // 2026-11-03 is a Tuesday.
  assert.equal(weekdayOf('2026-11-03'), 2);
  assert.equal(nextWeekdayRun(2, '2026-11-03'), '2026-11-03');
  assert.equal(nextWeekdayRun(1, '2026-11-03'), '2026-11-09');
  assert.equal(nextWeekdayRun(7, '2026-11-03'), '2026-11-08');
});
