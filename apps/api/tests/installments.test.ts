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

function database(includeMetadata = true) {
  const db = new DatabaseSync(':memory:');
  for (const name of filenames) {
    if (!includeMetadata && name.startsWith('0003')) continue;
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
    batch: (statements: { run: () => Promise<unknown> }[]) =>
      Promise.all(statements.map((s) => s.run())),
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
      { DB } as unknown as Env,
      {} as ExecutionContext,
    );
    return { status: response.status, body: (await response.json()) as any };
  };
}

test('migration backfills valid legacy suffixes without altering titles or ordinary movements', () => {
  const db = database(false);
  try {
    const titles = [
      'Notebook (Cuota 1/6)',
      'Pasajes (Cuota 6/6)',
      'Normal',
      'Compra (Cuota 0/6)',
      'Compra (Cuota 7/6)',
      'Compra (Cuota 1/1)',
      'Compra (Cuota 1.5/6)',
      'Compra (Cuota 1/6) extra',
      'Compra (Cuota 1/6x)',
      ' (Cuota 1/6)',
      'Compra (Cuota 1/999999999999999999999999)',
    ];
    for (const title of titles)
      db.prepare(
        `INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date)
      VALUES(?,100,1,'expense',1,'local_user','2026-01-01')`,
      ).run(title);
    apply(db, '0003_add_installment_metadata.sql');
    const rows = db
      .prepare(
        'SELECT title,installment_number,installment_total FROM transactions ORDER BY id',
      )
      .all();
    assert.deepEqual(
      rows.map((row) => row.title),
      titles,
    );
    assert.deepEqual(
      rows.map((row) => [row.installment_number, row.installment_total]),
      [[1, 6], [6, 6], ...titles.slice(2).map(() => [null, null])],
    );
    for (const [number, total] of [
      [1, null],
      [null, 6],
      [0, 6],
      [7, 6],
      [1, 1],
      [1.5, 6],
    ]) {
      assert.throws(() =>
        db
          .prepare(
            'UPDATE transactions SET installment_number=?,installment_total=? WHERE id=3',
          )
          .run(number, total),
      );
    }
  } finally {
    db.close();
  }
});

test('API creates installments with independent metadata and preserves it through edits, reads and sharing', async () => {
  const db = database();
  const api = request(db);
  try {
    const created = await api('/transactions', 'POST', {
      title: 'Notebook',
      amount: 1001,
      category_id: 1,
      type: 'expense',
      account_id: 1,
      date: '2026-01-31',
      installments: 3,
      tag_ids: [1],
      is_shared: 1,
      group_id: 1,
      splits: [
        { user_id: 'local_user', percentage: 50 },
        { user_id: 'bob', percentage: 50 },
      ],
    });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    assert.equal(created.body.transaction.installment_number, 1);
    assert.equal(created.body.transaction.installment_total, 3);
    const rows = db.prepare('SELECT * FROM transactions ORDER BY id').all();
    assert.deepEqual(
      rows.map((r) => r.title),
      ['Notebook', 'Notebook', 'Notebook'],
    );
    assert.deepEqual(
      rows.map((r) => r.installment_number),
      [1, 2, 3],
    );
    assert.deepEqual(
      rows.map((r) => r.installment_total),
      [3, 3, 3],
    );
    assert.deepEqual(
      rows.map((r) => r.date),
      ['2026-01-31', '2026-02-28', '2026-03-31'],
    );
    assert.equal(
      rows.reduce((sum, r) => sum + Number(r.amount), 0),
      1001,
    );
    assert.equal(
      db.prepare('SELECT count(*) AS n FROM transaction_tags').get()?.n,
      3,
    );
    assert.equal(
      db.prepare('SELECT count(*) AS n FROM transaction_splits').get()?.n,
      6,
    );
    const id = Number(rows[1]!.id);
    const updated = await api(`/transactions/${id}`, 'PUT', {
      title: 'Notebook de trabajo',
      installment_number: 1,
      installment_total: 99,
    });
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.transaction.installment_number, 2);
    assert.equal(updated.body.transaction.installment_total, 3);
    assert.equal(updated.body.transaction.title, 'Notebook de trabajo');
    const fetched = await api(`/transactions/${id}`);
    assert.equal(fetched.body.transaction.installment_number, 2);
    const shared = await api(
      '/transactions?endDate=2026-12-31',
      'GET',
      undefined,
      'installments-bob-test',
    );
    assert.equal(shared.status, 200);
    assert.equal(shared.body.transactions.length, 3);
    assert.equal(
      shared.body.transactions.find((r: any) => r.id === id).installment_total,
      3,
    );
    assert.equal(
      (
        await api(
          `/transactions/${id}`,
          'PUT',
          { title: 'Ajeno' },
          'installments-bob-test',
        )
      ).status,
      404,
    );
  } finally {
    db.close();
  }
});

test('API validates installment counts and leaves ordinary transactions without metadata', async () => {
  const db = database();
  const api = request(db);
  const base = {
    title: 'Compra',
    amount: 100,
    category_id: 1,
    type: 'expense',
    account_id: 1,
    date: '2026-01-01',
  };
  try {
    for (const installments of [0, -1, 1.5, 37]) {
      const response = await api('/transactions', 'POST', {
        ...base,
        installments,
      });
      assert.equal(response.status, 400, JSON.stringify(response.body));
    }
    assert.equal(
      (
        await api('/transactions', 'POST', {
          ...base,
          type: 'income',
          installments: 3,
        })
      ).status,
      400,
    );
    for (const installments of [undefined, 1]) {
      const response = await api('/transactions', 'POST', {
        ...base,
        installments,
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.transaction.installment_number, null);
      assert.equal(response.body.transaction.installment_total, null);
    }
  } finally {
    db.close();
  }
});
