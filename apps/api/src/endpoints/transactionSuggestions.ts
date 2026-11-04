import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';
import { todayLocal } from '../utils/date';

const LOOKBACK_MONTHS = 12;
const MAX_RESULTS = 5;

export class TransactionSuggestions extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary:
      'Suggest earlier transactions whose title matches, to prefill a new one',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        q: z.string().trim().min(2).max(60).describe('Part of the title'),
        type: z.enum(['expense', 'income']).optional(),
      }),
    },
    responses: {
      '200': {
        description:
          'Distinct titles from the last 12 months, prefix matches first, then by use',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              suggestions: z.array(
                z.object({
                  title: z.string(),
                  type: z.enum(['expense', 'income']),
                  category_id: z.number().nullable(),
                  category: z.string().nullable(),
                  category_icon: z.string().nullable(),
                  account_id: z.number().nullable(),
                  amount: z.number(),
                  uses: z.number(),
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
    const { q, type } = data.query;
    const userId = c.get('userId');

    const today = todayLocal();
    const since = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    since.setUTCMonth(since.getUTCMonth() - (LOOKBACK_MONTHS - 1));
    const pattern = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);

    // Installment rows are skipped: their amount is one cuota, not the purchase.
    const { results } = await c.env.DB.prepare(
      `SELECT s.title, s.type, s.category_id, c.name AS category, c.icon AS category_icon,
				s.account_id, s.amount, s.uses
			 FROM (
				SELECT t.title, t.type, t.category_id, t.account_id, t.amount,
					COUNT(*) OVER (PARTITION BY LOWER(t.title), t.type) AS uses,
					ROW_NUMBER() OVER (
						PARTITION BY LOWER(t.title), t.type ORDER BY t.date DESC, t.id DESC
					) AS rn
				FROM transactions t
				WHERE t.user_id = ? AND t.date >= ? AND t.date <= ?
					AND t.installment_total IS NULL
					AND LOWER(t.title) LIKE LOWER(?) ESCAPE '\\'
					${type ? 'AND t.type = ?' : ''}
			 ) s
			 LEFT JOIN categories c ON c.id = s.category_id
			 WHERE s.rn = 1
			 ORDER BY CASE WHEN LOWER(s.title) LIKE LOWER(?) ESCAPE '\\' THEN 0 ELSE 1 END,
				s.uses DESC, s.title ASC
			 LIMIT ?`,
    )
      .bind(
        userId,
        since.toISOString().slice(0, 10),
        today,
        `%${pattern}%`,
        ...(type ? [type] : []),
        `${pattern}%`,
        MAX_RESULTS,
      )
      .all();

    return { success: true, suggestions: results };
  }
}
