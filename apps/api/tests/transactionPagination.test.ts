import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';

const migrations = new URL('../migrations/', import.meta.url);
const filenames = readdirSync(migrations)
  .filter((name) => name.endsWith('.sql'))
  .sort();
const apply = (db: DatabaseSync, name: string) =>
  db.exec(readFileSync(new URL(name, migrations), 'utf8'));

function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of filenames) {
    apply(db, name);
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type) VALUES(1,'local_user','Compras','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'local_user','Tarjeta','credit');
    INSERT INTO tags(id,user_id,name) VALUES(1,'local_user','Viaje');
    INSERT INTO api_keys(key,user_id) VALUES('installments-bob-test','bob');
    INSERT INTO shared_groups(id,name,created_by,invite_code) VALUES(1,'Amigos','local_user','test');
    INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES(1,'local_user','Local'),(1,'bob','Bob');
  `);
  return db;
}

function request(db: DatabaseSync) {
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
    batch: (statements: { all: () => Promise<unknown> }[]) =>
      Promise.all(statements.map((s) => s.all())),
  };
  return async (
    path: string,
    method = 'GET',
    body?: unknown,
    key = 'local-dev-api-key',
  ) => {
    const response = await worker.fetch(
      new Request(`https://expense.example/api${path}`, {
        method,
        headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      { DB, ENVIRONMENT: 'development' } as unknown as Env,
      {} as ExecutionContext,
    );
    return { status: response.status, body: (await response.json()) as any };
  };
}

test('pagination returns every matching transaction exactly once with stable ordering', async () => {
  const db = database();
  const api = request(db);
  try {
    const insert =
      db.prepare(`INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date,created_at,is_shared,group_id)
      VALUES(?,100,1,'expense',1,?,?,'2026-01-01 10:00:00',1,1)`);
    for (let i = 0; i < 125; i++) {
      const row = insert.run('Compra & café', 'local_user', '2026-01-15');
      db.prepare(
        'INSERT INTO transaction_tags(transaction_id,tag_id) VALUES(?,1)',
      ).run(row.lastInsertRowid);
    }
    insert.run('Otro mes', 'local_user', '2025-12-15');
    insert.run('Otro usuario', 'bob', '2026-01-15');
    insert.run('Otro título', 'local_user', '2026-01-15');
    const filter =
      'limit=50&startDate=2026-01-01&endDate=2026-01-31&category_id=1&tag_id=1&is_shared=1&group_id=1&search=Compra';
    const ids: number[] = [];
    for (let page = 1; page <= 3; page++) {
      const response = await api(`/transactions?${filter}&page=${page}`);
      assert.equal(response.status, 200);
      assert.equal(response.body.transactions.length, page === 3 ? 25 : 50);
      assert.equal(response.body.hasMore, page < 3);
      assert.equal(response.body.nextPage, page < 3 ? page + 1 : null);
      ids.push(...response.body.transactions.map((tx: any) => tx.id));
    }
    assert.deepEqual(
      ids,
      Array.from({ length: 125 }, (_, i) => 125 - i),
    );
    const empty = await api(`/transactions?${filter}&page=4`);
    assert.deepEqual(empty.body.transactions, []);
    assert.equal(empty.body.hasMore, false);
    assert.equal(empty.body.nextPage, null);
    const capped = await api('/transactions?limit=1000&endDate=2026-01-31');
    assert.equal(capped.body.transactions.length, 100);
  } finally {
    db.close();
  }
});

test('pagination merges owned and split-with-me transactions once each, in order', async () => {
  const db = database();
  const api = request(db);
  try {
    const insert =
      db.prepare(`INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date,created_at,is_shared,group_id)
      VALUES(?,?,1,'expense',1,?,?,'2026-01-01 10:00:00',?,?)`);
    const split = db.prepare(
      'INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage) VALUES(?,?,?,50)',
    );
    const expected: { id: number; date: string }[] = [];
    for (let day = 1; day <= 30; day++) {
      const date = `2026-01-${String(day).padStart(2, '0')}`;
      const own = insert.run('Mío', 100, 'local_user', date, 0, null);
      expected.push({ id: Number(own.lastInsertRowid), date });
      const mine = insert.run('Mío compartido', 200, 'local_user', date, 1, 1);
      split.run(mine.lastInsertRowid, 'local_user', 100);
      split.run(mine.lastInsertRowid, 'bob', 100);
      expected.push({ id: Number(mine.lastInsertRowid), date });
      const bobs = insert.run('De Bob', 300, 'bob', date, 1, 1);
      split.run(bobs.lastInsertRowid, 'local_user', 150);
      split.run(bobs.lastInsertRowid, 'bob', 150);
      expected.push({ id: Number(bobs.lastInsertRowid), date });
      insert.run('Solo Bob', 999, 'bob', date, 0, null);
    }
    expected.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

    const ids: number[] = [];
    for (let page = 1; page <= 4; page++) {
      const response = await api(
        `/transactions?limit=25&endDate=2026-01-31&page=${page}`,
      );
      assert.equal(response.status, 200);
      ids.push(...response.body.transactions.map((tx: any) => tx.id));
      assert.equal(response.body.hasMore, page < 4);
    }
    assert.deepEqual(
      ids,
      expected.map((tx) => tx.id),
    );

    const shared = await api(
      '/transactions?limit=100&endDate=2026-01-31&is_shared=1',
    );
    assert.equal(shared.body.transactions.length, 60);
    const bobRow = shared.body.transactions.find(
      (tx: any) => tx.title === 'De Bob',
    );
    assert.equal(bobRow.is_owner, false);
    assert.equal(bobRow.my_split_amount, 150);

    const balances = await api('/groups/balances?month=2026-01');
    assert.equal(balances.status, 200);
    const [group] = balances.body.balances;
    assert.equal(group.transaction_count, 60);
    const byUser = Object.fromEntries(
      group.members.map((m: any) => [m.user_id, m]),
    );
    assert.deepEqual(
      [byUser.local_user.total_paid, byUser.local_user.total_share],
      [6000, 7500],
    );
    assert.deepEqual(
      [byUser.bob.total_paid, byUser.bob.total_share],
      [9000, 7500],
    );
    assert.equal(byUser.local_user.net, -1500);

    const kpi = await api('/transactions/summary/kpi?month=2026-01');
    assert.deepEqual(kpi.body.kpis, {
      largest_expense: 200,
      largest_expense_title: 'Mío compartido',
      largest_income: 0,
      transaction_count: 60,
    });
  } finally {
    db.close();
  }
});
