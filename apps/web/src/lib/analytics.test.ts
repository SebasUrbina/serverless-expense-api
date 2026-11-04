import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryDeviations, compareWithNormal } from './analytics';

const summary = [
  { month: '2026-07', total_expense: 0, total_income: 0 },
  { month: '2026-08', total_expense: 900, total_income: 1000 },
  { month: '2026-09', total_expense: 1100, total_income: 1000 },
  { month: '2026-10', total_expense: 800, total_income: 1000 },
];

test('a closed month compares with the average of earlier months with spending', () => {
  const result = compareWithNormal(summary, '2026-10', '2026-11-03');
  assert.equal(result.average, 1000);
  assert.equal(result.pct, -20);
  assert.equal(result.monthsCompared, 2);
  assert.equal(result.inProgress, false);
});

test('a month in progress compares with earlier months by the same day', () => {
  const result = compareWithNormal(
    [
      {
        month: '2026-09',
        total_expense: 1000,
        total_income: 0,
        expense_to_day: 600,
      },
      {
        month: '2026-10',
        total_expense: 1200,
        total_income: 0,
        expense_to_day: 800,
      },
      {
        month: '2026-11',
        total_expense: 770,
        total_income: 0,
        expense_to_day: 770,
      },
    ],
    '2026-11',
    '2026-11-03',
  );
  assert.equal(result.average, 1100);
  assert.equal(result.expected, 700);
  assert.equal(result.pct, 10);
});

test('without earlier months there is nothing to compare', () => {
  const result = compareWithNormal(summary, '2026-08', '2026-11-03');
  assert.equal(result.average, null);
  assert.equal(result.pct, null);
});

test('category deviations skip months before the user started', () => {
  const deviations = categoryDeviations(
    {
      months: ['2026-07', '2026-08', '2026-09', '2026-10'],
      categories: [
        { category_id: 1, category: 'Súper', values: [0, 100, 300, 400] },
        { category_id: 2, category: 'Ocio', values: [0, 200, 200, 50] },
        { category_id: 3, category: 'Fijo', values: [0, 90, 90, 90] },
      ],
    },
    '2026-10',
  );
  assert.deepEqual(
    deviations.map((d) => [d.category, d.delta]),
    [
      ['Súper', 200],
      ['Ocio', -150],
    ],
  );
});

test('category deviations use the same-day baseline when present', () => {
  const deviations = categoryDeviations(
    {
      months: ['2026-09', '2026-10', '2026-11'],
      categories: [
        {
          category_id: 1,
          category: 'Arriendo',
          values: [500, 500, 500],
          values_to_day: [500, 500, 500],
        },
        {
          category_id: 2,
          category: 'Súper',
          values: [400, 400, 150],
          values_to_day: [100, 100, 150],
        },
      ],
    },
    '2026-11',
  );
  assert.deepEqual(
    deviations.map((d) => [d.category, d.delta]),
    [['Súper', 50]],
  );
});
