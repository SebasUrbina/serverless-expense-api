import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';

const migrations = new URL('../migrations/', import.meta.url);
const ME = 'local_user';
const MONTH = '2026-10';

/**
 * Seba (local_user) pays the supermarket, $42.000 split in three with Vale
 * and Tomás. Vale has a "Supermercado" category; Tomás only has "Compartidos".
 */
function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO api_keys(key,user_id) VALUES('key-vale','vale'),('key-tomas','tomas'),('key-new','newbie');
    INSERT INTO categories(id,user_id,name,type) VALUES
      (1,'${ME}','Supermercado','expense'),
      (2,'vale','Supermercado','expense'),
      (3,'tomas','Compartidos','expense'),
      (4,'${ME}','Sueldo','income');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'${ME}','Tarjeta','credit'),(2,'vale','Débito','checking');
    INSERT INTO shared_groups(id,name,created_by,invite_code) VALUES(1,'Depto','${ME}','K7P2QX');
    INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES
      (1,'${ME}','Seba'),(1,'vale','Vale'),(1,'tomas','Tomás');

    INSERT INTO transactions(id,title,amount,category_id,type,account_id,user_id,date,is_shared,group_id) VALUES
      (1,'Líder',42000,1,'expense',1,'${ME}','${MONTH}-05',1,1),
      (2,'Café',3000,1,'expense',1,'${ME}','${MONTH}-06',0,NULL),
      (3,'Sueldo',900000,4,'income',1,'${ME}','${MONTH}-01',0,NULL),
      -- Left by the removed settle endpoint: Vale paid Seba back.
      (4,'💸 Saldo — Depto',14000,2,'expense',2,'vale','${MONTH}-20',1,1),
      (5,'💸 Saldo recibido — Depto',14000,4,'income',1,'${ME}','${MONTH}-20',0,NULL);
    INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage) VALUES
      (1,'${ME}',14000,34),(1,'vale',14000,33),(1,'tomas',14000,33),
      (4,'${ME}',14000,100),(4,'vale',0,0);
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
      const results = [];
      for (const s of statements) results.push(await s.all());
      return results;
    },
  };
  return async (
    path: string,
    {
      key = 'local-dev-api-key',
      method = 'GET',
      body,
    }: { key?: string; method?: string; body?: unknown } = {},
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

const monthTotals = async (api: ReturnType<typeof client>, key?: string) => {
  const { body } = await api(
    `/transactions/summary/monthly?months=1&endMonth=${MONTH}`,
    { key },
  );
  return body.summary[0] ?? { total_expense: 0, total_income: 0 };
};

test('each member counts their share of a shared expense, whoever paid', async () => {
  const api = client(database());

  const me = await monthTotals(api);
  assert.equal(me.total_expense, 14000 + 3000);
  // The old "Saldo recibido" income was a transfer, not income.
  assert.equal(me.total_income, 900000);

  assert.equal((await monthTotals(api, 'key-vale')).total_expense, 14000);
  assert.equal((await monthTotals(api, 'key-tomas')).total_expense, 14000);
});

test('a share paid by someone else lands in the same-named category or Compartidos', async () => {
  const api = client(database());
  const categories = async (key?: string) =>
    (
      await api(`/transactions/summary/category?type=expense&month=${MONTH}`, {
        key,
      })
    ).body.summary.map((c: any) => [c.category_id, c.category, c.amount]);

  assert.deepEqual(await categories(), [[1, 'Supermercado', 17000]]);
  assert.deepEqual(await categories('key-vale'), [[2, 'Supermercado', 14000]]);
  assert.deepEqual(await categories('key-tomas'), [[3, 'Compartidos', 14000]]);

  // The category detail lists the same movements the summary counted.
  const list = async (key: string, categoryId: number) =>
    (
      await api(`/transactions?category_id=${categoryId}&endDate=${MONTH}-31`, {
        key,
      })
    ).body.transactions.map((tx: any) => tx.title);
  assert.deepEqual(await list('key-tomas', 3), ['Líder']);
  assert.deepEqual(await list('key-vale', 2), ['💸 Saldo — Depto', 'Líder']);
});

test('the budget and the largest expense use the share too', async () => {
  const api = client(database());

  const availability = await api(
    `/transactions/summary/availability?month=${MONTH}&timezone=America/Santiago`,
    { key: 'key-vale' },
  );
  assert.equal(availability.status, 200);
  assert.equal(availability.body.availability.spent, 14000);

  const kpi = await api(`/transactions/summary/kpi?month=${MONTH}`, {
    key: 'key-tomas',
  });
  assert.equal(kpi.body.kpis.largest_expense, 14000);
  assert.equal(kpi.body.kpis.largest_expense_title, 'Líder');
});

test('joining a group gives the member a Compartidos category', async () => {
  const db = database();
  const api = client(db);
  const joined = await api('/groups/join', {
    key: 'key-new',
    method: 'POST',
    body: { invite_code: 'K7P2QX', nickname: 'Nuevo' },
  });
  assert.equal(joined.status, 200);
  assert.deepEqual(
    db
      .prepare(`SELECT name, icon FROM categories WHERE user_id = 'newbie'`)
      .all()
      .map((r: any) => [r.name, r.icon]),
    [['Compartidos', '👥']],
  );
});
