import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index';
import {
  buildCategoryRequest,
  type Decide,
  type DecisionRequest,
  suggestCategory,
} from '../src/services/categorize';

const categories = [
  { id: 1, name: 'Transporte', icon: '🚌' },
  { id: 2, name: 'Comida', icon: '🍔' },
  { id: 3, name: 'Sin Categorizar', icon: '❓' },
];

function answering(choice: string, confidence: number) {
  const calls: DecisionRequest[] = [];
  const decide: Decide = async (request) => {
    calls.push(request);
    return {
      model: 'clef-flash',
      answers: {
        category: {
          type: 'choice',
          choice,
          probabilities: { [choice]: confidence },
          confidence,
        },
      },
      usage: { input_tokens: 120, output_tokens: 0 },
    };
  };
  return { decide, calls };
}

const uber = { title: 'UBER *TRIP', amount: 5490, type: 'expense' as const };

test('request offers every category except the fallback, keyed by id', () => {
  const request = buildCategoryRequest(uber, categories);
  assert.equal(request?.model, 'clef-flash');
  assert.deepEqual(request?.questions.category.criteria, {
    '1': 'Transporte',
    '2': 'Comida',
  });
  assert.deepEqual(request?.state, {
    merchant_or_description: 'UBER *TRIP',
    amount_clp: 5490,
    kind: 'expense',
    country: 'Chile',
  });
});

test('skips the model when there are fewer than two real categories', async () => {
  const { decide, calls } = answering('1', 0.9);
  const result = await suggestCategory(decide, uber, categories.slice(0, 1));
  assert.equal(result, null);
  assert.equal(calls.length, 0);
});

test('returns the chosen category when confidence clears the threshold', async () => {
  const { decide } = answering('1', 0.82);
  const result = await suggestCategory(decide, uber, categories);
  assert.equal(result?.categoryId, 1);
  assert.equal(result?.confidence, 0.82);
  assert.equal(result?.inputTokens, 120);
});

test('discards low-confidence and unknown answers', async () => {
  assert.equal(
    await suggestCategory(answering('1', 0.4).decide, uber, categories),
    null,
  );
  assert.equal(
    await suggestCategory(answering('99', 0.99).decide, uber, categories),
    null,
  );
});

test('errors and timeouts fall back instead of failing', async () => {
  const failing: Decide = async () => {
    throw new Error('3040: capacity');
  };
  assert.equal(await suggestCategory(failing, uber, categories), null);

  const hanging: Decide = () => new Promise(() => {});
  const started = Date.now();
  assert.equal(
    await suggestCategory(hanging, uber, categories, { timeoutMs: 50 }),
    null,
  );
  assert.ok(Date.now() - started < 1000);
});

function database() {
  const migrations = new URL('../migrations/', import.meta.url);
  const db = new DatabaseSync(':memory:');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  db.exec(`
    INSERT INTO categories(id,user_id,name,type,icon) VALUES
      (1,'local_user','Transporte','expense','🚌'),
      (2,'local_user','Comida','expense','🍔'),
      (3,'local_user','Sin Categorizar','expense','❓'),
      (4,'local_user','Sueldo','income','💰');
    INSERT INTO accounts(id,user_id,name,type) VALUES
      (1,'local_user','Sin Asignar','checking');
  `);
  return db;
}

function shortcut(db: DatabaseSync, AI?: unknown) {
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
  return async (body: Record<string, unknown>) => {
    const response = await worker.fetch(
      new Request('https://expense.example/api/shortcuts/transactions', {
        method: 'POST',
        headers: {
          'X-API-Key': 'local-dev-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }),
      { DB, AI, ENVIRONMENT: 'development' } as unknown as Env,
      {} as ExecutionContext,
    );
    return { status: response.status, body: (await response.json()) as any };
  };
}

function fakeAi(choice: string, confidence: number) {
  const inputs: DecisionRequest[] = [];
  return {
    inputs,
    models: [] as string[],
    async run(model: string, input: DecisionRequest) {
      this.models.push(model);
      inputs.push(input);
      return {
        model: 'clef-flash',
        answers: {
          category: {
            type: 'choice',
            choice,
            probabilities: { [choice]: confidence },
            confidence,
          },
        },
        usage: { input_tokens: 90, output_tokens: 0 },
      };
    },
  };
}

test('shortcut transactions without a category are classified by Clef-flash', async () => {
  const ai = fakeAi('1', 0.9);
  const res = await shortcut(
    database(),
    ai,
  )({ title: 'UBER *TRIP', amount: '5.490' });
  assert.equal(res.status, 200);
  assert.equal(res.body.transaction.category_id, 1);
  assert.deepEqual(ai.models, ['@cf/cloudflare/clef-flash']);
  // Income categories are not offered for an expense.
  assert.deepEqual(Object.keys(ai.inputs[0]!.questions.category.criteria), [
    '1',
    '2',
  ]);
});

test('an explicit category skips the model', async () => {
  const ai = fakeAi('1', 0.9);
  const res = await shortcut(
    database(),
    ai,
  )({
    title: 'UBER *TRIP',
    amount: 5490,
    category_name: 'Comida',
  });
  assert.equal(res.body.transaction.category_id, 2);
  assert.equal(ai.inputs.length, 0);
});

test('unsure model or missing binding keep Sin Categorizar', async () => {
  const unsure = await shortcut(
    database(),
    fakeAi('1', 0.3),
  )({
    title: 'COMPRA 8812',
    amount: 1000,
  });
  assert.equal(unsure.body.transaction.category_id, 3);

  const noBinding = await shortcut(database())({ title: 'UBER', amount: 1000 });
  assert.equal(noBinding.body.transaction.category_id, 3);
});
