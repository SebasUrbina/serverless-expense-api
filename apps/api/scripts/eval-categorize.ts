/**
 * Runs real Clef-flash calls against the default categories.
 *
 *   CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... pnpm --filter api eval:categorize
 *
 * The token needs the "Workers AI: Read" permission. Each case costs a few
 * hundred input tokens, well inside the free daily Workers AI allocation.
 */
import {
  CLEF_FLASH,
  type Decide,
  DEFAULT_MIN_CONFIDENCE,
  type DecisionResponse,
  suggestCategory,
} from '../src/services/categorize';

const categories = [
  'Supermercado',
  'Transporte',
  'Servicios',
  'Ocio',
  'Salud',
  'Arriendo',
  'Gastos Comunes',
  'Comida',
  'Agua',
  'Luz',
  'Gas',
  'Internet',
  'Plan Movil',
  'Suscripciones',
  'Farmacia',
  'Regalos',
  'Eventos',
  'Comisiones',
  'Vacaciones',
  'Ropa',
  'Otros',
  'Sin Categorizar',
].map((name, i) => ({ id: i + 1, name, icon: null }));

// expected: null means the model should stay unsure and keep Sin Categorizar.
const cases: { title: string; amount: number; expected: string | null }[] = [
  { title: 'UBER *TRIP', amount: 5490, expected: 'Transporte' },
  { title: 'COPEC LAS CONDES', amount: 32000, expected: 'Transporte' },
  { title: 'Carga Bip!', amount: 10000, expected: 'Transporte' },
  { title: 'LIDER EXPRESS', amount: 18750, expected: 'Supermercado' },
  { title: 'JUMBO COSTANERA', amount: 64300, expected: 'Supermercado' },
  { title: 'UNIMARC', amount: 12990, expected: 'Supermercado' },
  { title: 'RAPPI*MCDONALDS', amount: 11900, expected: 'Comida' },
  { title: 'Almuerzo con el equipo', amount: 15000, expected: 'Comida' },
  { title: 'NETFLIX.COM', amount: 7990, expected: 'Suscripciones' },
  { title: 'SPOTIFY P1A2B3', amount: 5300, expected: 'Suscripciones' },
  { title: 'ENTEL PCS RECARGA', amount: 15990, expected: 'Plan Movil' },
  { title: 'VTR BANDA ANCHA', amount: 24990, expected: 'Internet' },
  { title: 'ENEL DISTRIBUCION', amount: 38400, expected: 'Luz' },
  { title: 'AGUAS ANDINAS', amount: 17200, expected: 'Agua' },
  { title: 'METROGAS', amount: 29800, expected: 'Gas' },
  { title: 'CRUZ VERDE', amount: 8990, expected: 'Farmacia' },
  { title: 'Consulta dermatólogo', amount: 45000, expected: 'Salud' },
  { title: 'FALABELLA ZARA', amount: 39990, expected: 'Ropa' },
  { title: 'PUNTOTICKET', amount: 55000, expected: 'Eventos' },
  { title: 'SKY AIRLINE', amount: 120000, expected: 'Vacaciones' },
  { title: 'COMISION MANTENCION', amount: 4500, expected: 'Comisiones' },
  {
    title: 'Gastos comunes octubre',
    amount: 85000,
    expected: 'Gastos Comunes',
  },
  { title: 'COMPRA 000123', amount: 3000, expected: null },
];

async function main() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) {
    console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
    process.exit(1);
  }
  const minConfidence = Number(
    process.env.MIN_CONFIDENCE ?? DEFAULT_MIN_CONFIDENCE,
  );

  let lastRaw: DecisionResponse | null;
  let lastLatency = 0;
  const decide: Decide = async (request) => {
    const started = performance.now();
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${CLEF_FLASH}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    );
    const body = (await res.json()) as {
      success: boolean;
      result: DecisionResponse;
      errors: unknown[];
    };
    lastLatency = performance.now() - started;
    if (!res.ok || !body.success) {
      throw new Error(`${res.status} ${JSON.stringify(body.errors)}`);
    }
    lastRaw = body.result;
    return body.result;
  };

  const byId = new Map(categories.map((c) => [c.id, c.name]));
  let correct = 0;
  let tokens = 0;
  const latencies: number[] = [];

  for (const tc of cases) {
    lastRaw = null;
    const suggestion = await suggestCategory(
      decide,
      { title: tc.title, amount: tc.amount, type: 'expense' },
      categories,
      { minConfidence, timeoutMs: 10_000 },
    );
    const raw = lastRaw as DecisionResponse | null;
    const top = raw?.answers.category;
    const predicted = suggestion ? byId.get(suggestion.categoryId)! : null;
    const ok = predicted === tc.expected;
    if (ok) correct++;
    tokens += raw?.usage.input_tokens ?? 0;
    latencies.push(lastLatency);

    console.log(
      [
        ok ? 'OK  ' : 'FAIL',
        tc.title.padEnd(26),
        `esperado=${tc.expected ?? '(sin categoría)'}`.padEnd(30),
        `modelo=${top ? byId.get(Number(top.choice)) : 'error'}`.padEnd(28),
        `conf=${top?.confidence.toFixed(2) ?? '-'}`,
        `${Math.round(lastLatency)}ms`,
      ].join('  '),
    );
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length / 2)] ?? 0;
  console.log(
    `\nAciertos: ${correct}/${cases.length} con umbral ${minConfidence}` +
      ` · latencia p50 ${Math.round(p50)}ms · ${tokens} tokens` +
      ` (~$${((tokens / 1e6) * 0.038).toFixed(6)})`,
  );
}

main();
