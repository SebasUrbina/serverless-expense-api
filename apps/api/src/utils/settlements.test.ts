import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeSettlementPairs } from './settlements';

const member = (user_id: string, net: number) => ({
  user_id,
  nickname: user_id.toUpperCase(),
  net,
});

test('largest debtor pays largest creditor first, by user id', () => {
  assert.deepEqual(
    computeSettlementPairs([
      member('a', 30000),
      member('b', -20000),
      member('c', -10000),
    ]),
    [
      {
        from_user_id: 'b',
        from_nickname: 'B',
        to_user_id: 'a',
        to_nickname: 'A',
        amount: 20000,
      },
      {
        from_user_id: 'c',
        from_nickname: 'C',
        to_user_id: 'a',
        to_nickname: 'A',
        amount: 10000,
      },
    ],
  );
});

test('members with the same nickname stay distinct', () => {
  const pairs = computeSettlementPairs([
    { user_id: 'a', nickname: 'Sofi', net: 5000 },
    { user_id: 'b', nickname: 'Sofi', net: -5000 },
  ]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0]!.from_user_id, 'b');
  assert.equal(pairs[0]!.to_user_id, 'a');
});

test('balances under one peso need no transfer', () => {
  assert.deepEqual(
    computeSettlementPairs([member('a', 0.4), member('b', -0.4)]),
    [],
  );
});
