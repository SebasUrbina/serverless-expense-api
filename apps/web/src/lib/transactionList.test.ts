import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import {
  transactionListOptions,
  type TransactionFilters,
  type TransactionPage,
} from './transactionList';

const filters: TransactionFilters = {
  search: 'Compra & café',
  month: '2026-01',
  category: 1,
  tag: 2,
  shared: true,
  group: 3,
};

test('loads successive pages with all filters, stops at the end and resets for another month', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const urls: URL[] = [];
  const options = (month = '2026-01') =>
    transactionListOptions({ ...filters, month }, async (url, signal) => {
      assert.ok(signal instanceof AbortSignal);
      const parsed = new URL(url, 'https://example.test');
      urls.push(parsed);
      const page = Number(parsed.searchParams.get('page'));
      return {
        transactions: [],
        hasMore: page < 3,
        nextPage: page < 3 ? page + 1 : null,
      };
    });
  const observer = new InfiniteQueryObserver(client, options());
  try {
    await observer.refetch();
    await observer.fetchNextPage();
    await observer.fetchNextPage();
    await observer.fetchNextPage();
    assert.deepEqual(
      urls.map((url) => url.searchParams.get('page')),
      ['1', '2', '3'],
    );
    for (const url of urls) {
      for (const [key, value] of Object.entries({
        limit: '50',
        search: filters.search,
        category_id: '1',
        tag_id: '2',
        is_shared: '1',
        group_id: '3',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })) {
        assert.equal(url.searchParams.get(key), value);
      }
    }
    assert.equal(observer.getCurrentResult().hasNextPage, false);
    observer.setOptions(options('2026-02'));
    await observer.refetch();
    assert.equal(urls.at(-1)?.searchParams.get('page'), '1');
    assert.equal(urls.at(-1)?.searchParams.get('endDate'), '2026-02-28');
    assert.equal(observer.getCurrentResult().data?.pages.length, 1);
  } finally {
    observer.destroy();
    client.clear();
  }
});

test('failed next page keeps previous data and retries the same page; invalidation refreshes loaded pages', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const calls: number[] = [];
  let fail = true;
  const observer = new InfiniteQueryObserver(
    client,
    transactionListOptions(filters, async (url) => {
      const page = Number(
        new URL(url, 'https://example.test').searchParams.get('page'),
      );
      calls.push(page);
      if (page === 2 && fail) throw new Error('offline');
      return {
        transactions: [{ id: page }],
        hasMore: page < 2,
        nextPage: page < 2 ? page + 1 : null,
      } as TransactionPage;
    }),
  );
  const unsubscribe = observer.subscribe(() => {});
  try {
    await observer.refetch();
    await observer.fetchNextPage();
    assert.equal(observer.getCurrentResult().isFetchNextPageError, true);
    assert.equal(
      observer.getCurrentResult().data?.pages[0]?.transactions[0]?.id,
      1,
    );
    fail = false;
    await observer.fetchNextPage();
    assert.deepEqual(calls, [1, 2, 2]);
    assert.equal(observer.getCurrentResult().data?.pages.length, 2);
    await client.invalidateQueries({ queryKey: ['transactions'] });
    assert.deepEqual(calls, [1, 2, 2, 1, 2]);
  } finally {
    unsubscribe();
    observer.destroy();
    client.clear();
  }
});
