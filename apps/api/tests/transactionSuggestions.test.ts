import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';
import { todayLocal } from '../src/utils/date';

const migrations = new URL('../migrations/', import.meta.url);

function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type,icon) VALUES
      (1,'local_user','Transporte','expense','🚗'),
      (2,'local_user','Comida','expense','🍔'),
      (3,'local_user','Sueldo','income','💰');
    INSERT INTO accounts(id,user_id,name,type) VALUES
      (1,'local_user','Tarjeta','credit'),(2,'local_user','Débito','checking');
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
  };
  return async (path: string) => {
    const response = await worker.fetch(
      new Request(`https://expense.example/api${path}`, {
        headers: { 'X-API-Key': 'local-dev-api-key' },
      }),
      { DB, ENVIRONMENT: 'development' } as unknown as Env,
      {} as ExecutionContext,
    );
    return { status: response.status, body: (await response.json()) as any };
  };
}

test('suggestions group titles, keep the latest details and rank prefix matches first', async () => {
  const db = database();
  const api = request(db);
  const today = todayLocal();
  const insert = db.prepare(
    `INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date)
     VALUES(?,?,?,?,?,?,?)`,
  );
  try {
    insert.run('Uber', 4000, 1, 'expense', 1, 'local_user', '2026-01-02');
    insert.run('uber', 5200, 1, 'expense', 2, 'local_user', today);
    insert.run('Uber Eats', 9000, 2, 'expense', 1, 'local_user', today);
    insert.run('Cena uber', 1000, 2, 'expense', 1, 'local_user', today);
    insert.run('Uber', 300000, 3, 'income', 2, 'local_user', today);
    insert.run('Uber', 100, 1, 'expense', 1, 'bob', today);
    insert.run('Uber viejo', 100, 1, 'expense', 1, 'local_user', '2020-01-01');
    db.prepare(
      `INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date,installment_number,installment_total)
       VALUES('Uber cuotas',100,1,'expense',1,'local_user',?,1,3)`,
    ).run(today);

    const { status, body } = await api(
      '/transactions/suggestions?q=UB&type=expense',
    );
    assert.equal(status, 200);
    assert.deepEqual(
      body.suggestions.map((s: any) => [
        s.title,
        s.amount,
        s.account_id,
        s.uses,
      ]),
      [
        ['uber', 5200, 2, 2],
        ['Uber Eats', 9000, 1, 1],
        ['Cena uber', 1000, 1, 1],
      ],
    );
    assert.equal(body.suggestions[0].category, 'Transporte');

    const tooShort = await api('/transactions/suggestions?q=u');
    assert.equal(tooShort.status, 400);
  } finally {
    db.close();
  }
});

test('suggestion search treats % and _ literally', async () => {
  const db = database();
  const api = request(db);
  try {
    db.prepare(
      `INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date)
       VALUES('Café 100%',2500,2,'expense',1,'local_user',?),('Café 1000',3000,2,'expense',1,'local_user',?)`,
    ).run(todayLocal(), todayLocal());
    const { body } = await api(
      `/transactions/suggestions?q=${encodeURIComponent('0%')}`,
    );
    assert.deepEqual(
      body.suggestions.map((s: any) => s.title),
      ['Café 100%'],
    );
  } finally {
    db.close();
  }
});
