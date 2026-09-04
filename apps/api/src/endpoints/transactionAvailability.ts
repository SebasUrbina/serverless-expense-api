import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';
import {
  calculateAvailability,
  dateInTimezone,
  monthEnd,
  type PlannedRule,
  type PlannedTransaction,
} from '../services/monthlyAvailability';

export const AvailabilityQuery = z.object({
  month: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/),
  timezone: z
    .string()
    .max(100)
    .default('America/Santiago')
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid timezone'),
});

export class TransactionAvailability extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary:
      'Monthly budget availability and upcoming expenses (full amounts paid by the user)',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: { query: AvailabilityQuery },
    responses: {
      '200': {
        description:
          'Recorded expenses through today, future transactions and ungenerated recurring expenses; dates are not payment confirmations',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              availability: z.object({
                month: z.string(),
                as_of: z.string(),
                period: z.enum(['past', 'current', 'future']),
                budget: z.number().nullable(),
                spent: z.number(),
                committed: z.number(),
                available: z.number().nullable(),
                daily_available: z.number().nullable(),
                remaining_days: z.number(),
                payment_count: z.number(),
                payments: z.array(
                  z.object({
                    id: z.string(),
                    title: z.string(),
                    amount: z.number(),
                    date: z.string(),
                    source: z.enum(['transaction', 'recurring']),
                  }),
                ),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const {
      query: { month, timezone },
    } = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');
    const start = `${month}-01`;
    const end = monthEnd(month);
    // A batch supplies a consistent snapshot if the recurring scheduler runs concurrently.
    const [budgetResult, transactionResult, ruleResult] = await c.env.DB.batch([
      c.env.DB.prepare(
        "SELECT amount FROM budgets WHERE user_id = ? AND month = ? AND scope = 'general'",
      ).bind(userId, month),
      c.env.DB.prepare(
        `SELECT id, title, amount, date, recurring_rule_id FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
      ).bind(userId, start, end),
      c.env.DB.prepare(
        `SELECT id, title, amount, frequency, day_of_month, next_run, end_date FROM recurring_rules
        WHERE user_id = ? AND type = 'expense' AND is_active = 1 AND next_run <= ?
        AND (end_date IS NULL OR end_date >= ?)`,
      ).bind(userId, end, start),
    ]);
    c.header('Cache-Control', 'private, no-store');
    return {
      success: true,
      availability: calculateAvailability(
        month,
        dateInTimezone(new Date(), timezone),
        (budgetResult.results[0] as { amount: number } | undefined)?.amount ??
          null,
        transactionResult.results as PlannedTransaction[],
        ruleResult.results as PlannedRule[],
      ),
    };
  }
}
