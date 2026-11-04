import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeSettlements } from './settlements';

test('two members settle with a single transfer', () => {
  assert.deepEqual(
    computeSettlements([
      { nickname: 'Ana', net: 15000 },
      { nickname: 'Beto', net: -15000 },
    ]),
    [{ debtor: 'Beto', creditor: 'Ana', amount: 15000 }],
  );
});

test('largest debtor pays largest creditor first', () => {
  assert.deepEqual(
    computeSettlements([
      { nickname: 'Ana', net: 30000 },
      { nickname: 'Beto', net: -20000 },
      { nickname: 'Caro', net: -10000 },
    ]),
    [
      { debtor: 'Beto', creditor: 'Ana', amount: 20000 },
      { debtor: 'Caro', creditor: 'Ana', amount: 10000 },
    ],
  );
});

test('balances under one peso need no transfer', () => {
  assert.deepEqual(
    computeSettlements([
      { nickname: 'Ana', net: 0.4 },
      { nickname: 'Beto', net: -0.4 },
    ]),
    [],
  );
  assert.deepEqual(computeSettlements([{ nickname: 'Ana', net: 100 }]), []);
});
