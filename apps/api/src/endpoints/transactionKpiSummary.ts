import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { MonthParam, type AppContext } from '../types';
import { myMovementsCte } from '../utils/myMovements';
import { monthEnd } from '../services/monthlyAvailability';
import { todayLocal } from '../utils/date';

export class TransactionKpiSummary extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'Get Key Performance Indicators for Transactions',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        month: MonthParam.optional().openapi({
          description: 'Optional month filter in YYYY-MM format',
        }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns advanced KPIs',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              kpis: z.object({
                largest_expense: z.number().nullable(),
                largest_expense_title: z.string().nullable(),
                largest_income: z.number().nullable(),
                transaction_count: z.number(),
              }),
            }),
          },
        },
      },
      '400': { description: 'Invalid month' },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { month } = data.query;
    const userId = c.get('userId');

    const mine = month
      ? myMovementsCte(userId, `${month}-01`, monthEnd(month))
      : myMovementsCte(userId, '0000-01-01', todayLocal());

    const query = `
			WITH ${mine.sql}
			SELECT
				totals.largest_income,
				totals.transaction_count,
				top_expense.amount as largest_expense,
				top_expense.title as largest_expense_title
			FROM (
				SELECT
					MAX(CASE WHEN type = 'income' THEN amount END) as largest_income,
					COUNT(*) as transaction_count
				FROM my_tx
			) totals
			LEFT JOIN (
				SELECT amount, title FROM my_tx WHERE type = 'expense'
				ORDER BY amount DESC LIMIT 1
			) top_expense ON 1 = 1
		`;

    const result = (await c.env.DB.prepare(query)
      .bind(...mine.binds)
      .first()) as any;

    return {
      success: true,
      kpis: {
        largest_expense: result.largest_expense || 0,
        largest_expense_title: result.largest_expense_title || null,
        largest_income: result.largest_income || 0,
        transaction_count: result.transaction_count || 0,
      },
    };
  }
}
