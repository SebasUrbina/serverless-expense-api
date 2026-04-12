import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const API_URL = process.env.API_URL || 'http://127.0.0.1:8787';
const TOKEN = process.env.TOKEN;
const API_KEY = process.env.API_KEY;

if (!TOKEN && !API_KEY) {
  console.error('Por favor, provee un TOKEN o un API_KEY (ej. API_KEY=tu_key npx tsx scripts/migrate.ts)');
  process.exit(1);
}

const CATEGORY_MAP: Record<string, string> = {
  'Agua': 'Agua',
  'Arriendo': 'Arriendo',
  'Gasto Común': 'Gastos Comunes',
  'Internet': 'Internet',
  'Luz': 'Luz',
  'Almuerzo': 'Comida',
  'Comision BC': 'Comisiones',
  'Familia': 'Otros',
  'Farmacia': 'Farmacia',
  'Metro': 'Transporte',
  'Otros': 'Otros',
  'Recreacional': 'Ocio',
  'Regalos': 'Regalos',
  'Ropa': 'Ropa',
  'Supermercado': 'Comida',
  'Transporte': 'Transporte',
  'Vacaciones': 'Vacaciones',
  'Apps': 'Suscripciones',
  'Eventos': 'Eventos',
  'Electronica': 'Otros',
  'Hogar': 'Otros',
  'Limpieza': 'Otros',
  'Pension': 'Ingresos',
  'Ingreso': 'Ingresos'
};

const IGNORED_CATEGORIES = ['Criptomonedas', 'Fintual'];

async function apiCall(endpoint: string, method = 'GET', body?: any) {
  const rs = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  const text = await rs.text();
  try {
      const data = JSON.parse(text);
      return { status: rs.status, data };
  } catch(e) {
      return { status: rs.status, data: text };
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrate() {
  const csvPath = path.resolve(process.cwd(), 'Gasto - Movimientos.csv');
  if (!fs.existsSync(csvPath)) {
      console.error(`No se encontró el archivo CSV en la ruta: ${csvPath}`);
      process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Leídas ${records.length} filas del CSV.`);

  // Fetch categories
  console.log('Obteniendo categorías...');
  let rsCategories = await apiCall('/api/categories');
  if (rsCategories.status !== 200) {
     console.error('Error al obtener categorias', rsCategories.data);
     process.exit(1);
  }
  let categories = rsCategories.data.categories || [];
  
  // Fetch accounts
  console.log('Obteniendo cuentas...');
  let rsAccounts = await apiCall('/api/accounts');
  if (rsAccounts.status !== 200) {
      console.error('Error al obtener cuentas', rsAccounts.data);
      process.exit(1);
  }
  let accounts = rsAccounts.data.accounts || [];

  const resolveCategory = async (csvCat: string, csvTipo: string) => {
    const mappedName = CATEGORY_MAP[csvCat] || 'Otros';
    let type = 'expense';
    
    if (csvTipo.toLowerCase().includes('ingreso') || csvCat === 'Pension' || csvCat === 'Ingreso') {
        type = 'income';
    }

    let existing = categories.find((c: any) => c.name.toLowerCase() === mappedName.toLowerCase() && c.type === type);
    if (!existing) {
        console.log(`Creando categoría ${mappedName} (${type})...`);
        const rs = await apiCall('/api/categories', 'POST', { name: mappedName, type, icon: '📦' });
        if (rs.status === 200 && rs.data.success) {
            existing = rs.data.category;
            categories.push(existing);
        } else {
            console.error(`Error creando categoría: ${JSON.stringify(rs.data)}`);
            throw new Error('Error al crear categoría');
        }
    }
    return existing.id;
  };

  const resolveAccount = async (csvCuenta: string) => {
     let accountName = csvCuenta.trim();
     if (!accountName) accountName = 'Efectivo'; // Default

     let existing = accounts.find((a: any) => a.name.toLowerCase() === accountName.toLowerCase());
     if (!existing) {
         console.log(`Creando cuenta ${accountName}...`);
         let type = 'checking';
         if (accountName.toLowerCase().includes('tarjeta') || accountName.toLowerCase().includes('visa') || accountName.toLowerCase().includes('credito')) type = 'credit';
         else if (accountName.toLowerCase() === 'efectivo') type = 'cash';
         
         const rs = await apiCall('/api/accounts', 'POST', { name: accountName, type, balance: 0 });
         if (rs.status === 200 && rs.data.success) {
             existing = rs.data.account;
             accounts.push(existing);
         } else {
             console.error(`Error creando cuenta: ${JSON.stringify(rs.data)}`);
             throw new Error('Error al crear cuenta');
         }
     }
     return existing.id;
  };

  const parseDateStr = (dstr: string) => {
      // Formatos: DD/MM/YYYY
      const parts = dstr.split('/');
      if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
      }
      return dstr; // fallback
  };

  const parseAmountNum = (astr: string) => {
      if (!astr || astr.trim() === '-' || astr.trim() === '') return null;
      // Eliminar simbolo $, puntos, espacios
      let cleaned = astr.trim().replace(/[\$\.\s]/g, '');
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? null : num;
  };

  let imported = 0;
  let skipped = 0;

  console.log('Iniciando importación...');
  
  for (let i = 0; i < records.length; i++) {
     const row: any = records[i];
     const csvCategory = row['Categoria'] || '';
     
     if (IGNORED_CATEGORIES.includes(csvCategory)) {
         skipped++;
         continue;
     }

     const amount = parseAmountNum(row['Monto']);
     if (amount === null || amount <= 0) {
         skipped++;
         continue; // Monto nulo o 0
     }

     const date = parseDateStr(row['Fecha']);
     const title = row['Descripción'] || 'Transacción';

     const isIncome = row['Gasto/Ingreso']?.toLowerCase() === 'ingreso' || csvCategory === 'Pension' || csvCategory === 'Ingreso';

     try {
         const categoryId = await resolveCategory(csvCategory, row['Gasto/Ingreso'] || '');
         const accountId = await resolveAccount(row['Cuenta'] || '');
         
         const payload = {
             title,
             amount,
             category_id: categoryId,
             type: isIncome ? 'income' : 'expense',
             account_id: accountId,
             date,
             is_shared: Number(row['Pazi'] || '0') > 0 ? 1 : 0 // If there's shared logic, otherwise 0
         };

         const rs = await apiCall('/api/transactions', 'POST', payload);
         
         if (rs.status === 200) {
             imported++;
             // Imprimir progreso 10 en 10
             if (imported % 50 === 0) console.log(`... importadas ${imported} transacciones`);
         } else {
             console.error(`\nError importando fila ${i+2} (${title}):`, rs.data);
         }
         
         // Pequeña pausa para no saturar al API local / remoto
         await delay(20);

     } catch (e: any) {
         console.error(`\nExcepción en fila ${i+2}: ${e.message}`);
     }
  }

  console.log(`\nImportación finalizada.\n✅ Importados: ${imported}\n⏩ Omitidos/Malformados: ${skipped}`);
}

migrate().catch(console.error);
