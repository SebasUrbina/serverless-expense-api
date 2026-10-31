import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index';

const DB = {
  prepare() {
    const stmt = {
      bind: () => stmt,
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({}),
    };
    return stmt;
  },
};

async function status(
  url: string,
  headers: Record<string, string>,
  env: Record<string, unknown> = { DB },
) {
  const response = await worker.fetch(
    new Request(url, { headers }),
    env as unknown as Env,
    {} as ExecutionContext,
  );
  return response.status;
}

test('production rejects local auth shortcuts regardless of the request URL', async () => {
  const base = 'https://expense.example/api/categories';
  assert.equal(await status(`${base}?localhost`, {}), 401);
  assert.equal(await status(`${base}?127.0.0.1`, {}), 401);
  assert.equal(await status(base, { 'X-API-Key': 'local-dev-api-key' }), 401);
  assert.equal(
    await status(base, { Authorization: 'Bearer local-token' }),
    401,
  );
  assert.equal(
    await status(`${base}?localhost`, { Authorization: 'Bearer invalid' }),
    401,
  );
});

test('development enables local auth shortcuts', async () => {
  const env = { DB, ENVIRONMENT: 'development' };
  assert.equal(
    await status(
      'https://expense.example/api/categories',
      { 'X-API-Key': 'local-dev-api-key' },
      env,
    ),
    200,
  );
});
