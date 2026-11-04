import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ledgerEffect, memberColorSlot } from './groupLedger';

const me = 'user-me';

test('paying a split expense lends everything but your share', () => {
  assert.deepEqual(
    ledgerEffect(
      {
        title: 'Supermercado',
        amount: 42000,
        user_id: me,
        my_split_amount: 14000,
      },
      me,
    ),
    { kind: 'lent', amount: 28000 },
  );
});

test('an expense paid by someone else costs your share', () => {
  assert.deepEqual(
    ledgerEffect(
      { title: 'Gas', amount: 36000, user_id: 'other', my_split_amount: 12000 },
      me,
    ),
    { kind: 'owe', amount: 12000 },
  );
});

test('an expense you paid entirely for yourself lends nothing', () => {
  assert.deepEqual(
    ledgerEffect(
      { title: 'Café', amount: 3000, user_id: me, my_split_amount: 3000 },
      me,
    ),
    { kind: 'none' },
  );
});

test('settlements read as payments, not expenses', () => {
  const settlement = { title: '💸 Saldo — Depto', amount: 10000 };
  assert.deepEqual(
    ledgerEffect({ ...settlement, user_id: me, my_split_amount: 0 }, me),
    { kind: 'paid', amount: 10000 },
  );
  assert.deepEqual(
    ledgerEffect(
      { ...settlement, user_id: 'other', my_split_amount: 10000 },
      me,
    ),
    { kind: 'received', amount: 10000 },
  );
});

test('member colors are stable and within the category palette', () => {
  const slot = memberColorSlot('3f1c2a9e-7b1d-4c55-9a0e-1f2b3c4d5e6f');
  assert.equal(slot, memberColorSlot('3f1c2a9e-7b1d-4c55-9a0e-1f2b3c4d5e6f'));
  assert.ok(slot >= 1 && slot <= 8);
});
