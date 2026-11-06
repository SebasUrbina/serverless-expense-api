import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';

const migrations = new URL('../migrations/', import.meta.url);
const ME = 'local_user';

function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type) VALUES(1,'${ME}','Hogar','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'${ME}','Tarjeta','credit');
    INSERT INTO shared_groups(id,name,created_by,invite_code) VALUES(1,'Depto','${ME}','K7P2QX');
    INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES
      (1,'${ME}','Seba'),(1,'vale','Vale'),(1,'tomas','Tomás');
  `);
  return db;
}

function client(db: DatabaseSync) {
  const DB = {
    prepare(sql: string) {
      let values: (string | number | null)[] = [];
      const stmt = {
        bind(...params: (string | number | null)[]) {
          values = params;
          return stmt;
        },
        all: async () => ({ results: db.prepare(sql).all(...values) }),
        first: async () => db.prepare(sql).get(...values) ?? null,
        run: async () => db.prepare(sql).run(...values),
      };
      return stmt;
    },
    batch: async (statements: { all: () => Promise<unknown> }[]) => {
      db.exec('BEGIN');
      try {
        const results = [];
        for (const s of statements) results.push(await s.all());
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return async (method: string, path: string, body?: unknown) => {
    const response = await worker.fetch(
      new Request(`https://expense.example/api${path}`, {
        method,
        headers: {
          'X-API-Key': 'local-dev-api-key',
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      { DB, ENVIRONMENT: 'development' } as unknown as Env,
      {} as ExecutionContext,
    );
    return { status: response.status, body: (await response.json()) as any };
  };
}

const base = {
  title: 'Súper',
  amount: 20000,
  category_id: 1,
  type: 'expense',
  account_id: 1,
  date: '2026-10-05',
  is_shared: 1,
  group_id: 1,
};

const splitsOf = (db: DatabaseSync, transactionId: number) =>
  db
    .prepare(
      'SELECT user_id, amount, percentage FROM transaction_splits WHERE transaction_id = ? ORDER BY id',
    )
    .all(transactionId)
    .map((s: any) => [s.user_id, s.amount, s.percentage]);

test('equal thirds of $20.000 add up to the total', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', {
    ...base,
    splits: [
      { user_id: ME, percentage: 34 },
      { user_id: 'vale', percentage: 33 },
      { user_id: 'tomas', percentage: 33 },
    ],
  });
  assert.equal(created.status, 200);
  const amounts = splitsOf(db, created.body.transaction.id).map((s) => s[1]);
  assert.equal(
    amounts.reduce((a: number, b: number) => a + b, 0),
    20000,
  );
});

test('exact amounts are stored as sent, with their percentages', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', {
    ...base,
    splits: [
      { user_id: ME, amount: 12000 },
      { user_id: 'vale', amount: 8000 },
      { user_id: 'tomas', amount: 0 },
    ],
  });
  assert.equal(created.status, 200);
  assert.deepEqual(splitsOf(db, created.body.transaction.id), [
    [ME, 12000, 60],
    ['vale', 8000, 40],
    ['tomas', 0, 0],
  ]);

  const wrong = await api('POST', '/transactions', {
    ...base,
    splits: [
      { user_id: ME, amount: 12000 },
      { user_id: 'vale', amount: 7000 },
    ],
  });
  assert.equal(wrong.status, 400);
});

test('every installment is split exactly by the same proportions', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', {
    ...base,
    amount: 100000,
    installments: 3,
    splits: [
      { user_id: ME, amount: 50000 },
      { user_id: 'vale', amount: 50000 },
    ],
  });
  assert.equal(created.status, 200);
  const rows = db
    .prepare(
      `SELECT t.amount, SUM(s.amount) AS parts FROM transactions t
       JOIN transaction_splits s ON s.transaction_id = t.id GROUP BY t.id`,
    )
    .all() as { amount: number; parts: number }[];
  assert.equal(rows.length, 3);
  for (const row of rows) assert.equal(row.parts, row.amount);
});

test('editing the amount re-spreads the parts; unsharing removes them', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', {
    ...base,
    splits: [
      { user_id: ME, amount: 12000 },
      { user_id: 'vale', amount: 8000 },
    ],
  });
  const id = created.body.transaction.id;

  const edited = await api('PUT', `/transactions/${id}`, { amount: 30000 });
  assert.equal(edited.status, 200);
  assert.deepEqual(splitsOf(db, id), [
    [ME, 18000, 60],
    ['vale', 12000, 40],
  ]);

  const outsider = await api('PUT', `/transactions/${id}`, {
    splits: [
      { user_id: ME, amount: 15000 },
      { user_id: 'nobody', amount: 15000 },
    ],
  });
  assert.equal(outsider.status, 400);
  assert.equal(splitsOf(db, id).length, 2);

  const personal = await api('PUT', `/transactions/${id}`, { is_shared: 0 });
  assert.equal(personal.status, 200);
  assert.equal(personal.body.transaction.group_id, null);
  assert.deepEqual(splitsOf(db, id), []);
});
