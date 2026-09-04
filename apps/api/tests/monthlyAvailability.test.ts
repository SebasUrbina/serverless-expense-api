import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import {
  calculateAvailability,
  dateInTimezone,
  nextOccurrence,
  type PlannedRule,
  type PlannedTransaction,
} from '../src/services/monthlyAvailability';
import worker from '../src/index';

const rule = (overrides: Partial<PlannedRule> = {}): PlannedRule => ({
  id: 1,
  title: 'Arriendo',
  amount: 300_000,
  frequency: 'monthly',
  day_of_month: 5,
  next_run: '2026-09-05',
  end_date: null,
  ...overrides,
});
const tx = (
  overrides: Partial<PlannedTransaction> = {},
): PlannedTransaction => ({
  id: 1,
  title: 'Supermercado',
  amount: 50_000,
  date: '2026-09-01',
  recurring_rule_id: null,
  ...overrides,
});

test('reserves installments and recurring expenses without extrapolating paid rent', () => {
  const result = calculateAvailability(
    '2026-09',
    '2026-09-04',
    1_000_000,
    [
      tx({ amount: 300_000 }),
      tx({ id: 2, date: '2026-09-20', amount: 100_000 }),
    ],
    [rule({ amount: 20_000 })],
  );
  assert.equal(result.spent, 300_000);
  assert.equal(result.committed, 120_000);
  assert.equal(result.available, 580_000);
  assert.equal(result.remaining_days, 27);
  assert.equal(result.daily_available, 21481);
  assert.deepEqual(
    result.payments.map((p) => p.date),
    ['2026-09-05', '2026-09-20'],
  );
});

test('a generated occurrence appears once, before and after its date', () => {
  const transactions = [
    tx({ date: '2026-09-05', recurring_rule_id: 1, amount: 300_000 }),
  ];
  const before = calculateAvailability(
    '2026-09',
    '2026-09-04',
    500_000,
    transactions,
    [rule()],
  );
  const after = calculateAvailability(
    '2026-09',
    '2026-09-05',
    500_000,
    transactions,
    [rule()],
  );
  assert.equal(before.payment_count, 1);
  assert.equal(before.committed, 300_000);
  assert.equal(after.payment_count, 0);
  assert.equal(after.spent, 300_000);
  assert.equal(before.available, after.available);
});

test('expands every weekly occurrence, respects end date, keeps overdue dates', () => {
  const result = calculateAvailability(
    '2026-09',
    '2026-09-10',
    1000,
    [],
    [
      rule({
        frequency: 'weekly',
        amount: 100,
        next_run: '2026-08-25',
        end_date: '2026-09-15',
      }),
    ],
  );
  assert.deepEqual(
    result.payments.map((p) => p.date),
    ['2026-09-01', '2026-09-08', '2026-09-15'],
  );
  assert.equal(result.committed, 300);
});

test('handles daily leap month, missing budget, zero budget and overrun', () => {
  const result = calculateAvailability(
    '2028-02',
    '2028-01-31',
    null,
    [],
    [
      rule({
        frequency: 'daily',
        amount: 10,
        next_run: '2027-01-01',
      }),
    ],
  );
  assert.equal(result.remaining_days, 29);
  assert.equal(result.payment_count, 29);
  assert.equal(result.available, null);
  assert.equal(result.daily_available, null);
  const zero = calculateAvailability('2026-09', '2026-09-30', 0, [tx()], []);
  assert.equal(zero.available, -50_000);
  assert.equal(zero.daily_available, 0);
  assert.equal(zero.remaining_days, 1);
});

test('past months do not fabricate history from current recurring rules', () => {
  const result = calculateAvailability(
    '2026-08',
    '2026-09-04',
    1000,
    [tx({ date: '2026-08-15', amount: 100 }), tx()],
    [rule({ next_run: '2026-08-01' })],
  );
  assert.equal(result.period, 'past');
  assert.equal(result.available, 900);
  assert.equal(result.committed, 0);
  assert.equal(result.daily_available, null);
});

test('uses local date across UTC midnight and Chile DST changes', () => {
  assert.equal(
    dateInTimezone(new Date('2026-09-05T02:00:00Z'), 'America/Santiago'),
    '2026-09-04',
  );
  assert.equal(
    dateInTimezone(new Date('2026-09-07T02:00:00Z'), 'America/Santiago'),
    '2026-09-06',
  );
});

test('month-end recurrence does not skip February and annual rules advance', () => {
  assert.equal(
    nextOccurrence(rule({ day_of_month: 28 }), '2026-01-31'),
    '2026-02-28',
  );
  assert.equal(
    nextOccurrence(rule({ frequency: 'yearly' }), '2026-09-05'),
    '2027-09-05',
  );
});

test('API scopes budget, transactions and active expense rules to the authenticated user', async () => {
  const db = new DatabaseSync(':memory:');
  for (const file of readdirSync(
    new URL('../migrations/', import.meta.url),
  ).sort()) {
    db.exec(
      readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'),
    );
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type) VALUES(1,'alice','Gastos','expense');
    INSERT INTO accounts(id,user_id,name,type) VALUES(1,'alice','Cuenta','checking');
    INSERT INTO api_keys(key,user_id) VALUES('availability-test-alice','alice');
    INSERT INTO budgets(user_id,month,scope,amount) VALUES('alice','2030-01','general',1000),('bob','2030-01','general',99999);
    INSERT INTO transactions(title,amount,category_id,type,account_id,user_id,date) VALUES
      ('Cuota',100,1,'expense',1,'alice','2030-01-10'),
      ('Ajeno',99999,1,'expense',1,'bob','2030-01-10'),
      ('Ingreso',99999,1,'income',1,'alice','2030-01-10');
    INSERT INTO recurring_rules(user_id,title,amount,category_id,type,account_id,frequency,next_run,is_active) VALUES
      ('alice','Activo',200,1,'expense',1,'monthly','2030-01-15',1),
      ('alice','Pausado',99999,1,'expense',1,'monthly','2030-01-15',0),
      ('alice','Sueldo',99999,1,'income',1,'monthly','2030-01-15',1),
      ('bob','Ajeno',99999,1,'expense',1,'monthly','2030-01-15',1);
  `);
  const DB = {
    prepare(sql: string) {
      return {
        bind(...params: (string | number)[]) {
          return {
            all: async () => ({ results: db.prepare(sql).all(...params) }),
            first: async () => db.prepare(sql).get(...params) ?? null,
          };
        },
      };
    },
    batch: (statements: { all: () => Promise<unknown> }[]) =>
      Promise.all(statements.map((s) => s.all())),
  };
  const request = (query: string, authenticated = true) =>
    worker.fetch(
      new Request(
        `https://expense.example/api/transactions/summary/availability?${query}`,
        {
          headers: authenticated
            ? { 'X-API-Key': 'availability-test-alice' }
            : {},
        },
      ),
      { DB } as unknown as Env,
      {} as ExecutionContext,
    );
  try {
    const response = await request('month=2030-01&timezone=America/Santiago');
    assert.equal(response.status, 200);
    const { availability } = (await response.json()) as {
      availability: ReturnType<typeof calculateAvailability>;
    };
    assert.equal(availability.budget, 1000);
    assert.equal(availability.committed, 300);
    assert.equal(availability.available, 700);
    assert.equal(availability.payment_count, 2);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal((await request('month=2030-01', false)).status, 401);
    assert.equal((await request('month=2030-13')).status, 400);
    assert.equal((await request('month=2030-01&timezone=invalid')).status, 400);
  } finally {
    db.close();
  }
});
