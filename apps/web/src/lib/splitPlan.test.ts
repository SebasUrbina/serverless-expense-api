import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  editSendsSplits,
  equalPercentages,
  initialPercentages,
  splitAmounts,
  splitPayload,
} from './splitPlan';

const three = [{ user_id: 'seba' }, { user_id: 'vale' }, { user_id: 'tomas' }];
const two = [{ user_id: 'seba' }, { user_id: 'vale' }];

test('equal parts show as 34/33/33 % but split the pesos evenly', () => {
  const equal = equalPercentages(three);
  assert.deepEqual(equal, { seba: 34, vale: 33, tomas: 33 });
  assert.deepEqual(splitAmounts(equal, three, 20000), {
    seba: 6667,
    vale: 6667,
    tomas: 6666,
  });
  const payload = splitPayload(equal, three);
  assert.ok('splits' in payload);
  assert.ok(payload.splits.every((s) => s.percentage === 100 / 3));
});

test('other percentages are sent as chosen and add up exactly', () => {
  const custom = { seba: 70, vale: 30 };
  assert.deepEqual(splitAmounts(custom, two, 33333), {
    seba: 23333,
    vale: 10000,
  });
  assert.deepEqual(splitPayload(custom, two), {
    splits: [
      { user_id: 'seba', percentage: 70 },
      { user_id: 'vale', percentage: 30 },
    ],
  });
});

test('percentages must add up to 100', () => {
  assert.ok('error' in splitPayload({ seba: 60, vale: 30 }, two));
});

test('editing keeps the stored percentages', () => {
  const tx = {
    splits: [
      { user_id: 'seba', percentage: 60, amount: 12000 },
      { user_id: 'vale', percentage: 40, amount: 8000 },
    ],
  };
  assert.deepEqual(initialPercentages(tx, two), { seba: 60, vale: 40 });
  assert.deepEqual(initialPercentages(null, two), { seba: 50, vale: 50 });
});

test('an edit only sends the parts when the split or the group changes', () => {
  const shared = { is_shared: 1, group_id: 3 };
  assert.equal(editSendsSplits(shared, 3, false), false);
  assert.equal(editSendsSplits(shared, 3, true), true);
  assert.equal(editSendsSplits(shared, 4, false), true);
  assert.equal(editSendsSplits({ is_shared: 0 }, 3, false), true);
});
