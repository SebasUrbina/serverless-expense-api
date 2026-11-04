import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';

const migrations = new URL('../migrations/', import.meta.url);

function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type) VALUES(1,'local_user','Compras','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'local_user','Tarjeta','credit');
    INSERT INTO tags(id,user_id,name) VALUES(1,'local_user','Viaje');
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
    // D1 runs a batch atomically; mirror that so a failed insert leaves nothing behind.
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
  return async (body: unknown) => {
    const response = await worker.fetch(
      new Request('https://expense.example/api/transactions', {
        method: 'POST',
        headers: {
          'X-API-Key': 'local-dev-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }),
      { DB, ENVIRONMENT: 'development' } as unknown as Env,
      {} as ExecutionContext,
    );
    return { status: response.status, body: (await response.json()) as any };
  };
}

const base = {
  title: 'Café',
  amount: 3000,
  category_id: 1,
  type: 'expense',
  account_id: 1,
  date: '2026-11-03',
  tag_ids: [1],
};

test('repeating a client_id returns the movement already created', async () => {
  const db = database();
  const create = request(db);
  try {
    const first = await create({ ...base, client_id: 'offline-abc-123' });
    const retry = await create({ ...base, client_id: 'offline-abc-123' });
    assert.equal(first.status, 200);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.transaction.id, first.body.transaction.id);
    assert.deepEqual(retry.body.transaction.tag_ids, [1]);

    const other = await create({ ...base, client_id: 'offline-def-456' });
    assert.notEqual(other.body.transaction.id, first.body.transaction.id);
    await create(base);
    await create(base);
    const count = db
      .prepare('SELECT COUNT(*) AS n FROM transactions')
      .get() as {
      n: number;
    };
    assert.equal(count.n, 4);
  } finally {
    db.close();
  }
});

test('a retried installment purchase is not created twice', async () => {
  const db = database();
  const create = request(db);
  try {
    const body = {
      ...base,
      amount: 90000,
      installments: 3,
      client_id: 'cuotas-0001',
    };
    await create(body);
    const retry = await create(body);
    assert.equal(retry.body.transaction.installment_number, 1);
    const rows = db
      .prepare(
        'SELECT installment_number, client_id FROM transactions ORDER BY id',
      )
      .all();
    assert.deepEqual(
      rows.map((r: any) => [r.installment_number, r.client_id]),
      [
        [1, 'cuotas-0001'],
        [2, null],
        [3, null],
      ],
    );
  } finally {
    db.close();
  }
});

test('the same client_id from another user creates their own movement', async () => {
  const db = database();
  const create = request(db);
  try {
    db.exec(
      `INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date,client_id)
       VALUES('Ajeno',100,1,'expense',1,'bob','2026-11-01','shared-key-1')`,
    );
    const mine = await create({ ...base, client_id: 'shared-key-1' });
    assert.equal(mine.body.transaction.title, 'Café');
    assert.equal(mine.body.transaction.user_id, 'local_user');
  } finally {
    db.close();
  }
});
