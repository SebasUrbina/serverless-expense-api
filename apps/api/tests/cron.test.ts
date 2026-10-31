import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { scheduled } from '../src/cron';

const migrations = new URL('../migrations/', import.meta.url);

function database() {
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type) VALUES(1,'alice','Hogar','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'alice','Cuenta','checking');
    INSERT INTO tags(id,user_id,name) VALUES(1,'alice','Fijo'),(2,'alice','Casa');
  `);
  return db;
}

function d1(db: DatabaseSync) {
  return {
    prepare(sql: string) {
      let values: (string | number | null)[] = [];
      const stmt = {
        bind(...params: (string | number | null)[]) {
          values = params;
          return stmt;
        },
        all: async () => ({ results: db.prepare(sql).all(...values) }),
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
}

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

test('cron catches up missed occurrences, links tags and deactivates finished rules', async () => {
  const db = database();
  try {
    db.exec(`
      INSERT INTO recurring_rules(id,title,amount,category_id,type,account_id,user_id,frequency,next_run,end_date,is_active)
      VALUES
        (1,'Diario',10,1,'expense',1,'alice','daily','${daysAgo(2)}',NULL,1),
        (2,'Termina',20,1,'expense',1,'alice','daily','${daysAgo(1)}','${daysAgo(1)}',1),
        (3,'Futuro',30,1,'expense',1,'alice','daily','${daysAgo(-5)}',NULL,1);
      INSERT INTO recurring_rule_tags(recurring_rule_id,tag_id) VALUES(1,1),(1,2);
    `);

    await scheduled(
      {} as ScheduledEvent,
      { DB: d1(db) } as unknown as Env,
      {} as ExecutionContext,
    );

    const rows = db
      .prepare(
        'SELECT id, recurring_rule_id, date FROM transactions ORDER BY id',
      )
      .all();
    assert.deepEqual(
      rows.map((r) => [r.recurring_rule_id, r.date]),
      [
        [1, daysAgo(2)],
        [1, daysAgo(1)],
        [1, daysAgo(0)],
        [2, daysAgo(1)],
      ],
    );

    const tagCounts = db
      .prepare(
        `SELECT t.id, count(tt.tag_id) AS n FROM transactions t
         LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id GROUP BY t.id ORDER BY t.id`,
      )
      .all()
      .map((r) => r.n);
    assert.deepEqual(tagCounts, [2, 2, 2, 0]);

    const rules = db
      .prepare(
        'SELECT id, next_run, is_active FROM recurring_rules ORDER BY id',
      )
      .all()
      .map((r) => [r.id, r.next_run, r.is_active]);
    assert.deepEqual(rules, [
      [1, daysAgo(-1), 1],
      [2, daysAgo(0), 0],
      [3, daysAgo(-5), 1],
    ]);
  } finally {
    db.close();
  }
});
