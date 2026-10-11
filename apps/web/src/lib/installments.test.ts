import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInstallmentDetails } from './installments';

test('metadata identifies installments even after renaming the purchase', () => {
  for (const current of [1, 3, 6]) {
    assert.deepEqual(
      getInstallmentDetails({
        title: 'Nuevo nombre',
        installment_number: current,
        installment_total: 6,
      }),
      { title: 'Nuevo nombre', current, total: 6 },
    );
  }
});

test('legacy suffix is hidden only when it matches stored metadata', () => {
  assert.deepEqual(
    getInstallmentDetails({
      title: 'Notebook (Cuota 2/6)',
      installment_number: 2,
      installment_total: 6,
    }),
    { title: 'Notebook', current: 2, total: 6 },
  );
  assert.equal(getInstallmentDetails({ title: 'Notebook (Cuota 2/6)' }), null);
  assert.equal(
    getInstallmentDetails({
      title: 'Notebook (Cuota 3/6)',
      installment_number: 2,
      installment_total: 6,
    })?.title,
    'Notebook (Cuota 3/6)',
  );
});

test('ordinary transactions and invalid metadata have no badge', () => {
  for (const [current, total] of [
    [null, null],
    [1, null],
    [null, 6],
    [0, 6],
    [7, 6],
    [1, 1],
    [1.5, 6],
    [1, Infinity],
  ]) {
    assert.equal(
      getInstallmentDetails({
        title: 'Compra',
        installment_number: current,
        installment_total: total,
      }),
      null,
    );
  }
});
