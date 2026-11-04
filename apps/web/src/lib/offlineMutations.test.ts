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
  registerOfflineMutations,
  type CreateTransactionVariables,
} from './offlineMutations';

const payload: CreateTransactionVariables = {
  title: 'Café',
  amount: 2500,
  type: 'expense',
  date: '2026-11-03',
};

test('a movement created offline survives a reload and is sent on reconnect', async () => {
  const sent: CreateTransactionVariables[] = [];
  const create = async (p: CreateTransactionVariables) => {
    sent.push(p);
    return { success: true };
  };
  onlineManager.setOnline(false);
  const before = new QueryClient();
  const after = new QueryClient();
  try {
    registerOfflineMutations(before, create);
    const observer = new MutationObserver<
      unknown,
      Error,
      CreateTransactionVariables
    >(before, {
      mutationKey: CREATE_TRANSACTION_KEY,
    });
    void observer.mutate(payload);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(observer.getCurrentResult().isPaused, true);
    assert.equal(sent.length, 0);

    // What PersistQueryClientProvider stores, restored into a fresh client.
    const persisted = JSON.parse(JSON.stringify(dehydrate(before)));
    registerOfflineMutations(after, create);
    hydrate(after, persisted);

    onlineManager.setOnline(true);
    await after.resumePausedMutations();
    assert.deepEqual(sent, [payload]);
  } finally {
    onlineManager.setOnline(true);
    before.clear();
    after.clear();
  }
});
