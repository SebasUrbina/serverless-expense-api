import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';

const migrations = new URL('../migrations/', import.meta.url);
const ME = 'local_user';

/**
 * Group 1 (Depto): local_user, vale and tomas. Group 2 (Viaje): local_user and
 * vale. outsider belongs to no group.
 */
function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO api_keys(key,user_id) VALUES('key-vale','vale'),('key-out','outsider');
    INSERT INTO categories(id,user_id,name,type) VALUES
      (1,'${ME}','Hogar','expense'),(2,'${ME}','Sueldo','income'),
      (3,'vale','Hogar','expense'),(4,'outsider','Hogar','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES
      (1,'${ME}','Tarjeta','credit'),(2,'vale','Débito','checking'),(3,'outsider','Débito','checking');
    INSERT INTO shared_groups(id,name,created_by,invite_code) VALUES
      (1,'Depto','${ME}','K7P2QX'),(2,'Viaje','${ME}','V1AJE0');
    INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES
      (1,'${ME}','Seba'),(1,'vale','Vale'),(1,'tomas','Tomás'),
      (2,'${ME}','Seba'),(2,'vale','Vale');
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
  return async (
    method: string,
    path: string,
    { body, key = 'local-dev-api-key' }: { body?: unknown; key?: string } = {},
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

const halves = [
  { user_id: ME, percentage: 50 },
  { user_id: 'vale', percentage: 50 },
];
const base = {
  title: 'Súper',
  amount: 20000,
  category_id: 1,
  type: 'expense',
  account_id: 1,
  date: '2026-10-05',
};
const shared = { ...base, is_shared: 1, group_id: 1, splits: halves };

const count = (db: DatabaseSync, sql: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${sql}`).get() as { n: number }).n;
const splitsOf = (db: DatabaseSync, id: number) =>
  db
    .prepare(
      'SELECT user_id, amount FROM transaction_splits WHERE transaction_id = ? ORDER BY id',
    )
    .all(id)
    .map((s: any) => [s.user_id, s.amount]);

test('a shared movement needs a group the caller is in and at least one split', async () => {
  const db = database();
  const api = client(db);
  const create = async (body: object, key?: string) =>
    (await api('POST', '/transactions', { body, key })).status;

  assert.equal(await create({ ...shared, splits: [] }), 400);
  assert.equal(await create({ ...shared, splits: undefined }), 400);
  assert.equal(await create({ ...shared, group_id: undefined }), 400);
  // Splits without a group would show up in someone else's list.
  assert.equal(
    await create(
      {
        ...base,
        category_id: 4,
        account_id: 3,
        splits: [{ user_id: ME, amount: 20000 }],
      },
      'key-out',
    ),
    400,
  );
  assert.equal(
    await create(
      {
        ...shared,
        category_id: 4,
        account_id: 3,
        splits: [{ user_id: 'outsider', amount: 20000 }],
      },
      'key-out',
    ),
    403,
  );
  assert.equal(count(db, 'transactions'), 0);
  assert.equal(count(db, 'transaction_splits'), 0);

  assert.equal(await create(shared), 200);
  assert.equal(await create({ ...base, group_id: 1 }), 200);
  assert.deepEqual(
    db
      .prepare('SELECT is_shared, group_id FROM transactions ORDER BY id')
      .all()
      .map((t: any) => [t.is_shared, t.group_id]),
    [
      [1, 1],
      [0, null],
    ],
  );
});

test('income cannot be shared', async () => {
  const db = database();
  const api = client(db);
  const income = { ...shared, type: 'income', category_id: 2 };
  assert.equal(
    (await api('POST', '/transactions', { body: income })).status,
    400,
  );

  const created = await api('POST', '/transactions', { body: shared });
  const id = created.body.transaction.id;
  const edited = await api('PUT', `/transactions/${id}`, {
    body: { type: 'income', category_id: 2 },
  });
  assert.equal(edited.status, 400);
  assert.equal(edited.body.error, 'Only expenses can be shared');
});

test('moving a movement to another group needs new parts and membership', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', {
    body: {
      ...shared,
      splits: [
        { user_id: ME, amount: 10000 },
        { user_id: 'tomas', amount: 10000 },
      ],
    },
  });
  const id = created.body.transaction.id;
  const edit = (body: object) => api('PUT', `/transactions/${id}`, { body });

  // tomas isn't in Viaje: the old parts must not follow the movement.
  assert.equal((await edit({ group_id: 2 })).status, 400);
  assert.equal((await edit({ group_id: 2, splits: [] })).status, 400);
  db.exec(
    `INSERT INTO shared_groups(id,name,created_by) VALUES(3,'Ajeno','vale')`,
  );
  db.exec(
    `INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES(3,'vale','Vale')`,
  );
  assert.equal(
    (await edit({ group_id: 3, splits: [{ user_id: 'vale', amount: 20000 }] }))
      .status,
    403,
  );
  assert.deepEqual(splitsOf(db, id), [
    [ME, 10000],
    ['tomas', 10000],
  ]);

  const moved = await edit({ group_id: 2, splits: halves });
  assert.equal(moved.status, 200);
  assert.equal(moved.body.transaction.group_id, 2);
  assert.deepEqual(splitsOf(db, id), [
    [ME, 10000],
    ['vale', 10000],
  ]);

  // Sharing a personal movement needs parts too.
  const personal = await api('POST', '/transactions', { body: base });
  const pid = personal.body.transaction.id;
  assert.equal(
    (
      await api('PUT', `/transactions/${pid}`, {
        body: { is_shared: 1, group_id: 1 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api('PUT', `/transactions/${pid}`, {
        body: { is_shared: 1, group_id: 1, splits: halves },
      })
    ).status,
    200,
  );
  // Editing the title keeps the parts of the same group.
  assert.equal((await edit({ title: 'Pasajes' })).status, 200);
  assert.equal(splitsOf(db, id).length, 2);
});

test('only the owner deletes a shared movement, legacy payments included', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', { body: shared });
  const id = created.body.transaction.id;
  db.exec(`
    INSERT INTO transactions(id,title,amount,category_id,type,account_id,user_id,date,is_shared,group_id)
    VALUES(50,'💸 Saldo — Depto',10000,3,'expense',2,'vale','2026-10-20',1,1);
    INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage)
    VALUES(50,'${ME}',10000,100);
  `);

  assert.equal(
    (await api('DELETE', `/transactions/${id}`, { key: 'key-vale' })).status,
    404,
  );
  assert.equal((await api('DELETE', '/transactions/50')).status, 404);
  assert.equal(count(db, 'transactions'), 2);

  assert.equal((await api('DELETE', `/transactions/${id}`)).status, 200);
  assert.equal(
    (await api('DELETE', '/transactions/50', { key: 'key-vale' })).status,
    200,
  );
  assert.equal(count(db, 'transactions'), 0);
  assert.equal(count(db, 'transaction_splits'), 0);
});

test('movements of a group the owner left are locked', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', { body: shared });
  const id = created.body.transaction.id;
  db.exec(
    `DELETE FROM shared_group_members WHERE group_id = 1 AND user_id = '${ME}'`,
  );

  for (const [method, body] of [
    ['PUT', { title: 'Otro' }],
    ['PUT', { is_shared: 0 }],
    ['DELETE', undefined],
  ] as const) {
    const res = await api(method, `/transactions/${id}`, { body });
    assert.equal(res.status, 403, method);
    assert.equal(
      res.body.error,
      'You left this group; its movements can no longer be changed',
    );
  }
  assert.equal(count(db, 'transactions'), 1);
  assert.equal(splitsOf(db, id).length, 2);

  // Personal movements stay editable.
  const personal = await api('POST', '/transactions', { body: base });
  assert.equal(
    (
      await api('PUT', `/transactions/${personal.body.transaction.id}`, {
        body: { title: 'Pan' },
      })
    ).status,
    200,
  );
});

test('only shared movements of current groups show up as split with me', async () => {
  const db = database();
  const api = client(db);
  const created = await api('POST', '/transactions', { body: shared });
  const id = created.body.transaction.id;
  // Rows an outsider could have written before: a split for me with no group,
  // and an unshared movement carrying a split.
  db.exec(`
    INSERT INTO transactions(id,title,amount,category_id,type,account_id,user_id,date,is_shared,group_id) VALUES
      (60,'Inyectado',5000,4,'expense',3,'outsider','2026-10-06',1,NULL),
      (61,'Personal ajeno',5000,4,'expense',3,'outsider','2026-10-07',0,NULL);
    INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage) VALUES
      (60,'vale',5000,100),(61,'vale',5000,100);
  `);
  const titles = async () =>
    (
      await api('GET', '/transactions?endDate=2026-10-31', { key: 'key-vale' })
    ).body.transactions.map((t: any) => t.title);
  const fetch = async (txId: number) =>
    (await api('GET', `/transactions/${txId}`, { key: 'key-vale' })).status;

  assert.deepEqual(await titles(), ['Súper']);
  assert.equal(await fetch(id), 200);
  assert.equal(await fetch(60), 404);
  assert.equal(await fetch(61), 404);

  db.exec(
    `DELETE FROM shared_group_members WHERE group_id = 1 AND user_id = 'vale'`,
  );
  assert.deepEqual(await titles(), []);
  assert.equal(await fetch(id), 404);
  // The owner still sees their own movement.
  assert.equal((await api('GET', `/transactions/${id}`)).status, 200);
});
