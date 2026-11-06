import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allocate, splitRows, splitWeights } from './splits';

test('three equal parts of $20.000 add up exactly', () => {
  assert.deepEqual(allocate(20000, [1, 1, 1]), [6667, 6667, 6666]);
});

test('percentages spread every installment without losing pesos', () => {
  const parts = allocate(33333, [50, 50]);
  assert.equal(parts[0]! + parts[1]!, 33333);
});

test('a zero weight gets nothing', () => {
  assert.deepEqual(allocate(10000, [0, 1]), [0, 10000]);
});

test('amounts must add up to the total and be whole pesos', () => {
  assert.deepEqual(
    splitWeights(20000, [
      { user_id: 'a', amount: 12000 },
      { user_id: 'b', amount: 8000 },
    ]),
    { weights: [12000, 8000] },
  );
  assert.ok(
    'error' in
      splitWeights(20000, [
        { user_id: 'a', amount: 12000 },
        { user_id: 'b', amount: 7000 },
      ]),
  );
  assert.ok(
    'error' in
      splitWeights(100, [
        { user_id: 'a', amount: 99.5 },
        { user_id: 'b', amount: 0.5 },
      ]),
  );
});

test('percentages must add up to 100 and parts cannot mix kinds or repeat', () => {
  assert.deepEqual(
    splitWeights(20000, [
      { user_id: 'a', percentage: 34 },
      { user_id: 'b', percentage: 33 },
      { user_id: 'c', percentage: 33 },
    ]),
    { weights: [34, 33, 33] },
  );
  assert.ok('error' in splitWeights(20000, [{ user_id: 'a', percentage: 90 }]));
  assert.ok(
    'error' in
      splitWeights(20000, [
        { user_id: 'a', percentage: 50 },
        { user_id: 'b', amount: 10000 },
      ]),
  );
  assert.ok(
    'error' in
      splitWeights(20000, [
        { user_id: 'a', amount: 10000 },
        { user_id: 'a', amount: 10000 },
      ]),
  );
});

test('stored rows keep exact amounts and percentages that add up to 100', () => {
  assert.deepEqual(splitRows(20000, ['a', 'b', 'c'], [1, 1, 1]), [
    { user_id: 'a', amount: 6667, percentage: 34 },
    { user_id: 'b', amount: 6667, percentage: 33 },
    { user_id: 'c', amount: 6666, percentage: 33 },
  ]);
});
