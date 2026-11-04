import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MutationObserver,
  QueryClient,
  dehydrate,
  hydrate,
  onlineManager,
} from '@tanstack/react-query';
import {
  CREATE_TRANSACTION_KEY,
  DELETE_TRANSACTION_KEY,
  UPDATE_TRANSACTION_KEY,
  patchCachedTransaction,
  registerOfflineMutations,
  runTransactionMutation,
  type CreateTransactionVariables,
  type DeletedTransaction,
  type TransactionApi,
  type UpdateTransactionVariables,
} from './offlineMutations';

const created: CreateTransactionVariables = {
  title: 'Café',
  amount: 2500,
  type: 'expense',
  date: '2026-11-03',
  client_id: 'client-0001',
};
const edited: UpdateTransactionVariables = {
  id: 7,
  payload: { title: 'Uber', amount: 6000 },
};
const deleted: DeletedTransaction = {
  id: 8,
  title: 'Pan',
  amount: 1200,
  type: 'expense',
  date: '2026-11-02',
  category_id: 1,
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test('offline creates, edits and deletes survive a reload and are sent in order', async () => {
  const sent: string[] = [];
  const transactions: TransactionApi = {
    create: async (p) => sent.push(`create ${p.client_id}`),
    update: async (id) => sent.push(`update ${id}`),
    remove: async (id) => sent.push(`delete ${id}`),
  };
  onlineManager.setOnline(false);
  const before = new QueryClient();
  const after = new QueryClient();
  try {
    registerOfflineMutations(before, transactions);
    const create = new MutationObserver<
      unknown,
      Error,
      CreateTransactionVariables
    >(before, { mutationKey: CREATE_TRANSACTION_KEY });
    const update = new MutationObserver<
      unknown,
      Error,
      UpdateTransactionVariables
    >(before, { mutationKey: UPDATE_TRANSACTION_KEY });
    void create.mutate(created);
    void update.mutate(edited);
    void runTransactionMutation(before, DELETE_TRANSACTION_KEY, deleted);
    await flush();
    assert.equal(create.getCurrentResult().isPaused, true);
    assert.deepEqual(sent, []);

    // What PersistQueryClientProvider stores, restored into a fresh client.
    const persisted = JSON.parse(JSON.stringify(dehydrate(before)));
    registerOfflineMutations(after, transactions);
    hydrate(after, persisted);

    onlineManager.setOnline(true);
    await after.resumePausedMutations();
    await flush();
    assert.deepEqual(sent, ['create client-0001', 'update 7', 'delete 8']);
  } finally {
    onlineManager.setOnline(true);
    before.clear();
    after.clear();
  }
});

test('an edit is applied to every cached list that holds the movement', () => {
  const client = new QueryClient();
  client.setQueryData(['transactions', 'recent', '2026-11'], {
    transactions: [
      { id: 7, title: 'Uberr', amount: 5000 },
      { id: 9, title: 'Otro', amount: 1 },
    ],
  });
  client.setQueryData(['transactions', 'infinite-list', {}], {
    pages: [{ transactions: [{ id: 7, title: 'Uberr', amount: 5000 }] }],
    pageParams: [1],
  });
  client.setQueryData(['transactions', 'summary'], { total: 10 });

  patchCachedTransaction(client, 7, { title: 'Uber', amount: 6000 });

  assert.deepEqual(
    client.getQueryData<{ transactions: unknown[] }>([
      'transactions',
      'recent',
      '2026-11',
    ])?.transactions,
    [
      { id: 7, title: 'Uber', amount: 6000 },
      { id: 9, title: 'Otro', amount: 1 },
    ],
  );
  assert.deepEqual(
    client.getQueryData<{ pages: { transactions: unknown[] }[] }>([
      'transactions',
      'infinite-list',
      {},
    ])?.pages[0]?.transactions,
    [{ id: 7, title: 'Uber', amount: 6000 }],
  );
  assert.deepEqual(client.getQueryData(['transactions', 'summary']), {
    total: 10,
  });
  client.clear();
});
