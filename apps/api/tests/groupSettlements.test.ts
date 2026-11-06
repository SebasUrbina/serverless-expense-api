import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';

const migrations = new URL('../migrations/', import.meta.url);
const ME = 'local_user';

/** Group 1: local_user, vale and tomas, with an equal split of every expense. */
function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO api_keys(key,user_id) VALUES('key-vale','vale'),('key-tomas','tomas'),('key-out','outsider');
    INSERT INTO categories(id,user_id,name,type) VALUES(1,'${ME}','Hogar','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'${ME}','Tarjeta','credit');
    INSERT INTO shared_groups(id,name,created_by,invite_code) VALUES(1,'Depto','${ME}','K7P2QX');
    INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES
      (1,'${ME}','Seba'),(1,'vale','Vale'),(1,'tomas','Tomás');
  `);
  return db;
}

let nextTx = 1;
function sharedExpense(
  db: DatabaseSync,
  payer: string,
  amount: number,
  date: string,
) {
  const id = nextTx++;
  db.exec(`
    INSERT INTO transactions(id,title,amount,category_id,type,account_id,user_id,date,is_shared,group_id)
    VALUES(${id},'Gasto',${amount},1,'expense',1,'${payer}','${date}',1,1);
  `);
  for (const member of [ME, 'vale', 'tomas']) {
    db.exec(`
      INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage)
      VALUES(${id},'${member}',${amount / 3},33);
    `);
  }
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
      const results = [];
      for (const s of statements) results.push(await s.all());
      return results;
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

const netOf = (group: any, userId: string) =>
  Math.round(group.members.find((m: any) => m.user_id === userId).net);

test('the balance carries over between months and month totals stay apart', async () => {
  const db = database();
  sharedExpense(db, ME, 42000, '2026-09-10');
  sharedExpense(db, 'vale', 36000, '2026-10-02');
  // A future installment must not count until its date arrives.
  sharedExpense(db, ME, 99000, '2099-01-01');
  const api = client(db);

  const { status, body } = await api('GET', '/groups/balances?month=2026-10');
  assert.equal(status, 200);
  const group = body.balances[0];
  assert.equal(group.month, '2026-10');
  assert.equal(group.transaction_count, 1);
  assert.equal(netOf(group, ME), 42000 - 14000 - 12000);
  assert.equal(netOf(group, 'vale'), 36000 - 14000 - 12000);
  assert.equal(netOf(group, 'tomas'), -26000);

  const me = group.members.find((m: any) => m.user_id === ME);
  assert.equal(me.month_paid, 0);
  assert.equal(Math.round(me.month_share), 12000);
  assert.deepEqual(
    group.pairs.map((p: any) => [p.from_user_id, p.to_user_id, p.amount]),
    [
      ['tomas', ME, 16000],
      ['tomas', 'vale', 10000],
    ],
  );
});

test('a partial payment lowers the debt without creating movements', async () => {
  const db = database();
  sharedExpense(db, ME, 42000, '2026-10-02');
  const api = client(db);

  const paid = await api('POST', '/groups/1/settlements', {
    key: 'key-vale',
    body: {
      from_user_id: 'vale',
      to_user_id: ME,
      amount: 10000,
      date: '2026-10-05',
    },
  });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.settlement.created_by, 'vale');

  const { body } = await api('GET', '/groups/balances?month=2026-10');
  const group = body.balances[0];
  assert.equal(group.settlement_count, 1);
  assert.equal(netOf(group, ME), 28000 - 10000);
  assert.equal(netOf(group, 'vale'), -14000 + 10000);
  assert.equal(
    (db.prepare('SELECT COUNT(*) AS n FROM transactions').get() as any).n,
    1,
  );

  const list = await api('GET', '/groups/1/settlements?month=2026-10');
  assert.equal(list.body.settlements.length, 1);
});

test('only the payer or receiver records a payment, between members', async () => {
  const db = database();
  const api = client(db);
  const body = { from_user_id: 'vale', to_user_id: 'tomas', amount: 5000 };

  assert.equal(
    (await api('POST', '/groups/1/settlements', { body })).status,
    403,
  );
  assert.equal(
    (
      await api('POST', '/groups/1/settlements', {
        body: { from_user_id: ME, to_user_id: 'outsider', amount: 5000 },
      })
    ).status,
    400,
  );
  assert.equal(
    (await api('GET', '/groups/1/settlements', { key: 'key-out' })).status,
    403,
  );
});

test('the payer or the receiver can undo a payment, while members', async () => {
  const db = database();
  const api = client(db);
  const record = async () =>
    (
      await api('POST', '/groups/1/settlements', {
        body: { from_user_id: ME, to_user_id: 'vale', amount: 7000 },
      })
    ).body.settlement.id;
  const undo = async (id: number, key?: string) =>
    (await api('DELETE', `/groups/1/settlements/${id}`, { key })).status;

  const first = await record();
  assert.equal(await undo(first, 'key-tomas'), 404);
  assert.equal(await undo(first, 'key-out'), 403);
  assert.equal(await undo(first, 'key-vale'), 200);
  assert.equal(await undo(await record()), 200);
  assert.equal(
    (db.prepare('SELECT COUNT(*) AS n FROM group_settlements').get() as any).n,
    0,
  );

  const kept = await record();
  db.exec(`DELETE FROM shared_group_members WHERE user_id = 'vale'`);
  assert.equal(await undo(kept, 'key-vale'), 403);
});

test('a payment needs a real date that is not in the future', async () => {
  const api = client(database());
  const pay = async (date: string) =>
    (
      await api('POST', '/groups/1/settlements', {
        body: { from_user_id: ME, to_user_id: 'vale', amount: 1000, date },
      })
    ).status;

  assert.equal(await pay('2026-02-31'), 400);
  assert.equal(await pay('2026-13-01'), 400);
  assert.equal(await pay('2026-1-05'), 400);
  assert.equal(await pay('2099-01-01'), 400);
  assert.equal(await pay('2024-02-29'), 200);
});

test('month parameters must be real YYYY-MM months', async () => {
  const api = client(database());
  for (const path of [
    '/groups/balances?month=2026-13',
    '/groups/1/settlements?month=2026-00',
    '/transactions/summary/kpi?month=2026-1',
    '/transactions/summary/category?month=abc',
    '/transactions/summary/monthly?endMonth=2026-13',
    '/transactions/summary/category-trend?endMonth=2026-99',
    '/transactions/summary/availability?month=2026-13',
  ]) {
    assert.equal((await api('GET', path)).status, 400, path);
  }
  assert.equal((await api('GET', '/groups/balances')).status, 200);
  assert.equal((await api('GET', '/groups/1/settlements')).status, 200);
  assert.equal((await api('GET', '/transactions/summary/kpi')).status, 200);
});

test('shared income and shares of income are left out of the balance', async () => {
  const db = database();
  sharedExpense(db, ME, 30000, '2026-10-02');
  db.exec(`
    INSERT INTO categories(id,user_id,name,type) VALUES(2,'${ME}','Sueldo','income');
    INSERT INTO transactions(id,title,amount,category_id,type,account_id,user_id,date,is_shared,group_id)
    VALUES(900,'Ingreso',90000,2,'income',1,'${ME}','2026-10-03',1,1);
    INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage) VALUES
      (900,'${ME}',30000,34),(900,'vale',30000,33),(900,'tomas',30000,33);
  `);
  const { body } = await client(db)('GET', '/groups/balances?month=2026-10');
  const group = body.balances[0];
  assert.equal(group.transaction_count, 1);
  assert.equal(netOf(group, ME), 20000);
  assert.equal(netOf(group, 'vale'), -10000);
});

test('leaving is blocked by upcoming shared movements, own or split', async () => {
  const db = database();
  const api = client(db);
  // Settled: one upcoming installment paid by Vale, split in three.
  sharedExpense(db, 'vale', 30000, '2099-01-01');

  const blocked = await api('DELETE', '/groups/1/members/me');
  assert.equal(blocked.status, 409);
  assert.equal(
    blocked.body.error,
    'You have upcoming shared movements in this group',
  );
  assert.equal(blocked.body.net, undefined);
  assert.equal(
    (await api('DELETE', '/groups/1/members/me', { key: 'key-vale' })).status,
    409,
  );

  db.exec(`DELETE FROM transaction_splits WHERE user_id = 'tomas'`);
  assert.equal(
    (await api('DELETE', '/groups/1/members/me', { key: 'key-tomas' })).status,
    200,
  );
});

test('leaving needs a settled balance and hands the group to the next member', async () => {
  const db = database();
  sharedExpense(db, 'vale', 30000, '2026-10-02');
  const api = client(db);

  const blocked = await api('DELETE', '/groups/1/members/me');
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.net, -10000);

  await api('POST', '/groups/1/settlements', {
    body: { from_user_id: ME, to_user_id: 'vale', amount: 10000 },
  });
  const left = await api('DELETE', '/groups/1/members/me');
  assert.equal(left.status, 200);
  assert.equal(left.body.group_deleted, false);
  const group = db
    .prepare('SELECT created_by FROM shared_groups WHERE id = 1')
    .get() as any;
  assert.equal(group.created_by, 'vale');
  assert.equal(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM shared_group_members WHERE user_id = '${ME}'`,
        )
        .get() as any
    ).n,
    0,
  );
});

test('a group is deleted only when everyone is settled, leaving personal movements', async () => {
  const db = database();
  sharedExpense(db, ME, 30000, '2026-10-02');
  const api = client(db);

  assert.equal((await api('DELETE', '/groups/1')).status, 409);

  for (const member of ['vale', 'tomas']) {
    db.exec(`
      INSERT INTO group_settlements(group_id,from_user_id,to_user_id,amount,date,created_by)
      VALUES(1,'${member}','${ME}',10000,'2026-10-03','${member}');
    `);
  }
  assert.equal((await api('DELETE', '/groups/1')).status, 200);
  assert.deepEqual(
    { ...db.prepare('SELECT is_shared, group_id FROM transactions').get() },
    { is_shared: 0, group_id: null },
  );
  assert.equal(
    (db.prepare('SELECT COUNT(*) AS n FROM transaction_splits').get() as any).n,
    0,
  );
  assert.equal(
    (db.prepare('SELECT COUNT(*) AS n FROM group_settlements').get() as any).n,
    0,
  );
});
