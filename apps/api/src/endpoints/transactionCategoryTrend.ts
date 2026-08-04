import { Num, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';

export class TransactionCategoryTrend extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'Get expense trend grouped by category over the last N months',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        months: Num({
          description: 'Number of months to look back (default 12, max 24)',
          required: false,
          default: 12,
        }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns a per-category month-by-month expense trend',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              months: z.array(z.string()),
              categories: z.array(
                z.object({
                  category_id: z.number().nullable(),
                  category: z.string().nullable(),
                  category_icon: z.string().nullable(),
                  values: z.array(z.number()),
                }),
              ),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { months } = data.query;
    const userId = c.get('userId');

    const safeMonths = Math.max(1, Math.min(24, months || 12));

    // Build chronological list of YYYY-MM for the last N months (including current)
    const monthsArr: string[] = [];
    const now = new Date();
    for (let i = safeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsArr.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    }
    const startMonth = monthsArr[0] + '-01';

    const { results } = await c.env.DB.prepare(
      `SELECT
				t.category_id as category_id,
				c.name as category,
				c.icon as category_icon,
				strftime('%Y-%m', t.date) as month,
				SUM(t.amount) as amount
			 FROM transactions t
			 LEFT JOIN categories c ON c.id = t.category_id
			 WHERE t.user_id = ? AND t.type = 'expense'
			   AND t.date >= ? AND t.date <= date('now', 'localtime')
			 GROUP BY t.category_id, strftime('%Y-%m', t.date)
			 ORDER BY month ASC, amount DESC`,
    )
      .bind(userId, startMonth)
      .all();

    // Aggregate into per-category arrays aligned with monthsArr
    const catMap = new Map<
      number,
      {
        category_id: number;
        category: string | null;
        category_icon: string | null;
        values: number[];
      }
    >();
    for (const row of results as any[]) {
      if (row.category_id == null) continue;
      if (!catMap.has(row.category_id)) {
        catMap.set(row.category_id, {
          category_id: row.category_id,
          category: row.category,
          category_icon: row.category_icon,
          values: new Array(safeMonths).fill(0),
        });
      }
      const idx = monthsArr.indexOf(row.month);
      if (idx >= 0) {
        catMap.get(row.category_id)!.values[idx] = row.amount || 0;
      }
    }

    const categories = Array.from(catMap.values()).sort(
      (a, b) =>
        b.values.reduce((s, v) => s + v, 0) -
        a.values.reduce((s, v) => s + v, 0),
    );

    return {
      success: true,
      months: monthsArr,
      categories,
    };
  }
}
