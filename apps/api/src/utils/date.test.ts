import assert from 'node:assert/strict';
import { test } from 'node:test';
import { monthWindow } from './date';

test('defaults to the months ending today', () => {
  assert.deepEqual(monthWindow(3, undefined, '2026-11-03'), {
    months: ['2026-09', '2026-10', '2026-11'],
    start: '2026-09-01',
    end: '2026-11-03',
  });
});

test('ends on the last day of a past end month, across years', () => {
  assert.deepEqual(monthWindow(3, '2026-02', '2026-11-03'), {
    months: ['2025-12', '2026-01', '2026-02'],
    start: '2025-12-01',
    end: '2026-02-28',
  });
});

test('a future end month is capped at today', () => {
  assert.deepEqual(monthWindow(2, '2027-01', '2026-11-03'), {
    months: ['2026-10', '2026-11'],
    start: '2026-10-01',
    end: '2026-11-03',
  });
});
