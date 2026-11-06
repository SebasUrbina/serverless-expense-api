import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  equalSplit,
  initialSplitState,
  splitAmounts,
  splitPayload,
} from './splitPlan';

const me = 'seba';
const three = [{ user_id: me }, { user_id: 'vale' }, { user_id: 'tomas' }];
const two = [{ user_id: me }, { user_id: 'vale' }];

test('equal parts of $20.000 between three add up to the total', () => {
  assert.deepEqual(splitPayload(equalSplit(three), three, 20000, me), {
    splits: [
      { user_id: me, amount: 6667 },
      { user_id: 'vale', amount: 6667 },
      { user_id: 'tomas', amount: 6666 },
    ],
  });
});

test('"Todo para…" gives the whole amount to the other member', () => {
  const state = { mode: 'other' as const, percentages: {}, amounts: {} };
  assert.deepEqual(splitAmounts(state, two, 15000, me), {
    [me]: 0,
    vale: 15000,
  });
});

test('amounts must add up to the movement amount', () => {
  const state = {
    mode: 'amount' as const,
    percentages: {},
    amounts: { [me]: 12000, vale: 7000 },
  };
  const result = splitPayload(state, two, 20000, me);
  assert.ok('error' in result && result.error.includes('faltan $1.000'));
});

test('percentages must add up to 100', () => {
  const state = {
    mode: 'percent' as const,
    percentages: { [me]: 60, vale: 30 },
    amounts: {},
  };
  assert.ok('error' in splitPayload(state, two, 20000, me));
});

test('editing recovers equal, "Todo para…" and custom splits', () => {
  const tx = (amounts: number[]) => ({
    user_id: me,
    splits: amounts.map((amount, i) => ({
      user_id: three[i]!.user_id,
      amount,
      percentage: 0,
    })),
  });
  assert.equal(
    initialSplitState(tx([6667, 6667, 6666]), three, me).mode,
    'equal',
  );
  assert.equal(initialSplitState(tx([0, 15000]), two, me).mode, 'other');
  const custom = initialSplitState(tx([12000, 8000]), two, me);
  assert.equal(custom.mode, 'amount');
  assert.deepEqual(custom.amounts, { [me]: 12000, vale: 8000 });
});
