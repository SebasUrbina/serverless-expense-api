// Reports D1 rows read per API endpoint against a throwaway local D1 seeded with
// synthetic data. Usage: pnpm --filter api measure:rows [transactions=2000]
import { readFileSync, readdirSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';
import worker from '../src/index';

const USER = 'local_user';
const TOTAL = Number(process.argv[2] ?? 2000);
const SHARED_EVERY = 10;

type Meta = { meta?: { rows_read?: number } };

function counted(db: D1Database) {
  const usage = { rows: 0, queries: 0 };
  const tally = <T>(result: T) => {
    for (const r of (Array.isArray(result) ? result : [result]) as Meta[]) {
      usage.queries++;
      usage.rows += r?.meta?.rows_read ?? 0;
    }
    return result;
  };
  const wrap = (stmt: D1PreparedStatement): D1PreparedStatement =>
    new Proxy(stmt, {
      get(target, prop) {
        if (prop === 'bind')
          return (...args: unknown[]) => wrap(target.bind(...args));
        if (prop === 'all' || prop === 'run')
          return async () => tally(await target[prop]());
        if (prop === 'first')
          return async (column?: string) => {
            const { results } = tally(await target.all());
            const row = (results[0] ?? null) as Record<string, unknown> | null;
            return column && row ? row[column] : row;
          };
        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  const proxied = new Proxy(db, {
    get(target, prop) {
      if (prop === 'prepare') return (sql: string) => wrap(target.prepare(sql));
      if (prop === 'batch')
        return async (stmts: D1PreparedStatement[]) =>
          tally(await target.batch(stmts));
      const value = Reflect.get(target, prop);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return { db: proxied, usage };
}

async function migrate(db: D1Database) {
  const dir = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(new URL(file, dir), 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
}

async function seed(db: D1Database) {
  await db.batch([
    db.prepare(
      `INSERT INTO categories(id,user_id,name,type,icon) VALUES
       (1,?,'Supermercado','expense','🛒'),(2,?,'Transporte','expense','🚗'),
       (3,?,'Restaurantes','expense','🍽️'),(4,?,'Sueldo','income','💼')`,
    ).bind(USER, USER, USER, USER),
    db.prepare(`INSERT INTO accounts(id,user_id,name,type) VALUES(1,?,'Tarjeta','credit')`).bind(USER),
    db.prepare(`INSERT INTO tags(id,user_id,name) VALUES(1,?,'Viaje'),(2,?,'Trabajo')`).bind(USER, USER),
    db.prepare(`INSERT INTO shared_groups(id,name,created_by,invite_code) VALUES(1,'Casa',?,'x')`).bind(USER),
    db.prepare(
      `INSERT INTO shared_group_members(group_id,user_id,nickname) VALUES(1,?,'Yo'),(1,'partner','Pareja')`,
    ).bind(USER),
  ]);

  const today = new Date();
  const stmts: D1PreparedStatement[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - Math.floor((i * 730) / TOTAL));
    const date = d.toISOString().slice(0, 10);
    const income = i % 15 === 0;
    const shared = i % SHARED_EVERY === 0;
    const owner = shared && i % 20 === 0 ? 'partner' : USER;
    stmts.push(
      db
        .prepare(
          `INSERT INTO transactions(id,title,amount,category_id,type,account_id,user_id,date,is_shared,group_id)
           VALUES(?,?,?,?,?,1,?,?,?,?)`,
        )
        .bind(
          i + 1,
          `Movimiento ${i}`,
          1000 + ((i * 37) % 50000),
          income ? 4 : 1 + (i % 3),
          income ? 'income' : 'expense',
          owner,
          date,
          shared ? 1 : 0,
          shared ? 1 : null,
        ),
    );
    if (i % 3 === 0)
      stmts.push(
        db
          .prepare('INSERT INTO transaction_tags(transaction_id,tag_id) VALUES(?,?)')
          .bind(i + 1, 1 + (i % 2)),
      );
    if (shared)
      stmts.push(
        db
          .prepare(
            `INSERT INTO transaction_splits(transaction_id,user_id,amount,percentage) VALUES(?,?,500,50),(?,?,500,50)`,
          )
          .bind(i + 1, USER, i + 1, 'partner'),
      );
  }
  for (let i = 0; i < stmts.length; i += 500)
    await db.batch(stmts.slice(i, i + 500));
}

async function main() {
  const proxy = await getPlatformProxy<Env>({ persist: false });
  try {
    await migrate(proxy.env.DB);
    await seed(proxy.env.DB);

    const month = new Date().toISOString().slice(0, 7);
    const paths = [
      '/categories',
      '/tags',
      '/accounts',
      '/groups',
      '/transactions?limit=15',
      '/transactions?limit=50&page=1',
      '/transactions?limit=50&page=2',
      '/transactions?limit=50&page=10',
      `/transactions?limit=50&page=1&startDate=${month}-01&endDate=${month}-31`,
      '/transactions?limit=50&page=1&is_shared=1',
      '/transactions/summary/monthly?months=6',
      `/transactions/summary/category?type=expense&month=${month}`,
      `/transactions/summary/kpi?month=${month}`,
      '/transactions/summary/kpi',
      `/transactions/summary/availability?month=${month}`,
      '/transactions/summary/category-trend?months=12',
      `/budgets?month=${month}`,
      `/groups/balances?month=${month}`,
      '/recurring',
    ];

    console.log(`${TOTAL} transactions\n`);
    for (const path of paths) {
      const { db, usage } = counted(proxy.env.DB);
      const res = await worker.fetch(
        new Request(`http://localhost/api${path}`, {
          headers: { Authorization: 'Bearer local-token' },
        }),
        { ...proxy.env, DB: db, ENVIRONMENT: 'development' } as Env,
        proxy.ctx as unknown as ExecutionContext,
      );
      console.log(
        `${res.status}  ${String(usage.rows).padStart(7)} rows  ${String(usage.queries).padStart(2)} q  ${path}`,
      );
    }
  } finally {
    await proxy.dispose();
  }
}

void main();
