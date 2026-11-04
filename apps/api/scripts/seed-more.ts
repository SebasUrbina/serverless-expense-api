import { fakerES as faker } from '@faker-js/faker';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Configuración por defecto (solo desarrollo local)
const TARGET_USERS = [
  'local_user',
  '111ec6b3-b90c-4f57-832b-69afaa448b61', // ID Supabase del usuario
];

const MONTHS_BACK = 6;
const AVG_TRANSACTIONS_PER_MONTH = 25;

const CATEGORIES = [
  { id: 1, name: 'Supermercado y Alimentación', type: 'expense', icon: '🛒' },
  { id: 2, name: 'Transporte y Combustible', type: 'expense', icon: '🚗' },
  { id: 3, name: 'Servicios del Hogar', type: 'expense', icon: '🏠' },
  { id: 4, name: 'Restaurantes y Salidas', type: 'expense', icon: '🍽️' },
  { id: 5, name: 'Sueldo e Ingresos', type: 'income', icon: '💼' },
  { id: 6, name: 'Suscripciones y Tech', type: 'expense', icon: '💻' },
  { id: 7, name: 'Salud y Farmacias', type: 'expense', icon: '🏥' },
  { id: 8, name: 'Ropa y Compras', type: 'expense', icon: '🛍️' },
];

const ACCOUNTS = [
  {
    id: 1,
    name: 'Cuenta Corriente',
    type: 'checking',
    initialBalance: 1850000,
  },
  {
    id: 2,
    name: 'Tarjeta de Crédito',
    type: 'credit',
    initialBalance: -320000,
  },
  { id: 3, name: 'Efectivo', type: 'cash', initialBalance: 65000 },
];

const TAGS = [
  { id: 1, name: 'mensual' },
  { id: 2, name: 'supermercado' },
  { id: 3, name: 'ocio' },
  { id: 4, name: 'viajes' },
  { id: 5, name: 'salud' },
  { id: 6, name: 'tecnología' },
];

const MERCHANT_TEMPLATES: Record<
  number,
  { titles: string[]; minAmount: number; maxAmount: number; tagId?: number }
> = {
  1: {
    titles: [
      'Líder Express',
      'Jumbo Bilbao',
      'Unimarc Barrio',
      'Tottus Plaza',
      'Feria de Verduras',
      'Minimarket Don Pepe',
    ],
    minAmount: 12000,
    maxAmount: 145000,
    tagId: 2,
  },
  2: {
    titles: [
      'Carga Bip! Metro',
      'Copec Bencina',
      'Shell Fueling',
      'Uber Viaje',
      'Cabify',
      'Autopista Central Peaje',
    ],
    minAmount: 3500,
    maxAmount: 48000,
  },
  3: {
    titles: [
      'Cuenta de Luz Enel',
      'Aguas Andinas',
      'Gas Abastible / Lipigas',
      'VTR Internet & TV',
      'Gastos Comunes Edificio',
      'Movistar Móvil',
    ],
    minAmount: 15000,
    maxAmount: 110000,
    tagId: 1,
  },
  4: {
    titles: [
      'Starbucks Coffee',
      'McDonalds Combo',
      'Rappi Pedido',
      'UberEats Sushi',
      'Dominos Pizza',
      'Cena Restaurante Bar',
      'Café de la Esquina',
    ],
    minAmount: 4900,
    maxAmount: 52000,
    tagId: 3,
  },
  5: {
    titles: [
      'Sueldo Mensual Empresa',
      'Transferencia Freelance / Proyecto',
      'Reembolso Seguro Médico',
    ],
    minAmount: 850000,
    maxAmount: 2500000,
  },
  6: {
    titles: [
      'Spotify Family',
      'Netflix HD',
      'OpenAI ChatGPT Plus',
      'iCloud Storage 200GB',
      'Amazon Prime Video',
      'YouTube Premium',
    ],
    minAmount: 2990,
    maxAmount: 22000,
    tagId: 6,
  },
  7: {
    titles: [
      'Farmacias Ahumada',
      'Cruz Verde Remedios',
      'Salcobrand Cuidado Personal',
      'Consulta Médica General',
    ],
    minAmount: 8900,
    maxAmount: 65000,
    tagId: 5,
  },
  8: {
    titles: [
      'Falabella Ropa',
      'ZARA Zapatos',
      'Paris Tienda',
      'Mercado Libre Compra',
      'Decathlon Deporte',
    ],
    minAmount: 15990,
    maxAmount: 120000,
  },
};

const sql = (value: string) => `'${value.replace(/'/g, "''")}'`;

function byId<T extends { id: number }>(items: T[], id: number): T {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error(`Seed reference ${id} not found`);
  return item;
}

// IDs in CATEGORIES/ACCOUNTS/TAGS are local keys only: real rows are resolved
// by (user_id, name) because other users may already own those primary keys.
function generateSqlStatements(): string[] {
  const statements: string[] = ['PRAGMA foreign_keys = ON;'];

  statements.push(
    "INSERT OR IGNORE INTO api_keys (key, user_id) VALUES ('local-dev-api-key', 'local_user');",
  );

  for (const userId of TARGET_USERS) {
    const user = sql(userId);
    const categoryRef = (id: number) => {
      const cat = byId(CATEGORIES, id);
      return `(SELECT id FROM categories WHERE user_id = ${user} AND name = ${sql(cat.name)} AND type = '${cat.type}')`;
    };
    const accountRef = (id: number) =>
      `(SELECT id FROM accounts WHERE user_id = ${user} AND name = ${sql(byId(ACCOUNTS, id).name)})`;
    const tagRef = (id: number) =>
      `(SELECT id FROM tags WHERE user_id = ${user} AND name = ${sql(byId(TAGS, id).name)})`;

    for (const acc of ACCOUNTS) {
      statements.push(
        `INSERT OR IGNORE INTO accounts (user_id, name, type, balance) VALUES (${user}, ${sql(acc.name)}, '${acc.type}', ${acc.initialBalance});`,
      );
    }

    for (const cat of CATEGORIES) {
      statements.push(
        `INSERT OR IGNORE INTO categories (user_id, name, type, icon) VALUES (${user}, ${sql(cat.name)}, '${cat.type}', ${sql(cat.icon)});`,
      );
    }

    for (const tag of TAGS) {
      statements.push(
        `INSERT OR IGNORE INTO tags (user_id, name) VALUES (${user}, ${sql(tag.name)});`,
      );
    }

    // Transactions month by month
    const now = new Date();
    for (let m = MONTHS_BACK; m >= 0; m--) {
      const year = new Date(
        now.getFullYear(),
        now.getMonth() - m,
        1,
      ).getFullYear();
      const monthNum =
        new Date(now.getFullYear(), now.getMonth() - m, 1).getMonth() + 1;
      const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;

      // 1. Sueldo
      const incomeDate = `${monthStr}-01`;
      const incomeAmount = faker.number.int({ min: 1800000, max: 2400000 });
      statements.push(
        `INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date) VALUES ` +
          `('Sueldo Mensual Empresa', ${incomeAmount}, ${categoryRef(5)}, 'income', ${accountRef(1)}, ${user}, '${incomeDate}');`,
      );

      // 2. Gastos variados
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const txCount = faker.number.int({
        min: AVG_TRANSACTIONS_PER_MONTH - 5,
        max: AVG_TRANSACTIONS_PER_MONTH + 10,
      });

      for (let i = 0; i < txCount; i++) {
        const day = faker.number.int({
          min: 1,
          max: m === 0 ? Math.min(now.getDate(), daysInMonth) : daysInMonth,
        });
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${monthStr}-${dayStr}`;

        const categoryId = faker.helpers.arrayElement([
          1, 1, 1, 2, 2, 3, 4, 4, 6, 7, 8,
        ]);
        const template = MERCHANT_TEMPLATES[categoryId];
        const title = faker.helpers.arrayElement(template.titles);

        const rawAmount = faker.number.int({
          min: template.minAmount,
          max: template.maxAmount,
        });
        const amount = Math.round(rawAmount / 100) * 100;
        const accountId =
          categoryId === 1
            ? faker.helpers.arrayElement([1, 2])
            : categoryId === 4
              ? faker.helpers.arrayElement([1, 2, 3])
              : faker.helpers.arrayElement([1, 2]);

        statements.push(
          `INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date) VALUES ` +
            `(${sql(title)}, ${amount}, ${categoryRef(categoryId)}, 'expense', ${accountRef(accountId)}, ${user}, '${dateStr}');`,
        );

        if (template.tagId || faker.datatype.boolean(0.3)) {
          const tagId =
            template.tagId || faker.helpers.arrayElement([1, 2, 3, 4, 5, 6]);
          statements.push(
            `INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (last_insert_rowid(), ${tagRef(tagId)});`,
          );
        }
      }

      // 3. Presupuestos del mes
      statements.push(
        `INSERT OR IGNORE INTO budgets (user_id, month, scope, category_id, amount) VALUES ` +
          `(${user}, '${monthStr}', 'general', NULL, 1500000);`,
      );
      statements.push(
        `INSERT OR IGNORE INTO budgets (user_id, month, scope, category_id, amount) VALUES ` +
          `(${user}, '${monthStr}', 'category', ${categoryRef(1)}, 400000);`,
      );
      statements.push(
        `INSERT OR IGNORE INTO budgets (user_id, month, scope, category_id, amount) VALUES ` +
          `(${user}, '${monthStr}', 'category', ${categoryRef(4)}, 150000);`,
      );
    }
  }

  return statements;
}

async function main() {
  console.log(
    `🌱 Generando e insertando transacciones dummy directamente en D1 local (--local)...`,
  );

  const sqlStatements = generateSqlStatements();
  const fullSql = sqlStatements.join('\n');

  // Crear archivo temporal en os.tmpdir() para no dejar basura en el repositorio
  const tempFilePath = path.join(os.tmpdir(), `d1-seed-${Date.now()}.sql`);

  try {
    fs.writeFileSync(tempFilePath, fullSql, 'utf-8');

    execSync(`npx wrangler d1 execute DB --local --file="${tempFilePath}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });

    console.log(
      `\n🎉 ¡Éxito! Se insertaron ${sqlStatements.length} registros directamente en la base de datos local D1.`,
    );
  } catch (error) {
    console.error('❌ Error al insertar datos en D1 local:', error);
  } finally {
    // Limpieza automática del archivo temporal
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

main().catch(console.error);
