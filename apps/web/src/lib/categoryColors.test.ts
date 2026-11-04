import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildCategoryColors,
  CATEGORY_PALETTE,
  distinctCategoryColors,
} from './categoryColors';

test('colors stay stable regardless of input order', () => {
  const a = buildCategoryColors([12, 3, 7]);
  const b = buildCategoryColors([7, 12, 3]);
  assert.deepEqual([...a], [...b]);
  assert.equal(a.get(3), CATEGORY_PALETTE[0]);
});

test('categories shown together never share a color', () => {
  const ids = Array.from({ length: 10 }, (_, i) => i + 1);
  const colors = buildCategoryColors(ids);
  // 1 and 9 share a palette slot once the palette wraps.
  const result = distinctCategoryColors([1, 9, 3], colors);
  assert.equal(new Set(result).size, 3);
  assert.equal(result[0], colors.get(1));
  assert.equal(result[2], colors.get(3));
});

test('unknown categories still get a free color', () => {
  const result = distinctCategoryColors([null, 99], new Map());
  assert.deepEqual(result, [CATEGORY_PALETTE[0], CATEGORY_PALETTE[1]]);
});
