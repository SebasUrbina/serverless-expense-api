import { Bool, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, Budget } from '../types';

export class BudgetUpsert extends OpenAPIRoute {
  schema = {
    tags: ['Budgets'],
    summary: 'Create or update a budget for a month',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: Budget.omit({
              id: true,
              category_name: true,
              category_icon: true,
              user_id: true,
              created_at: true,
              updated_at: true,
            }).extend({
              amount: z.number().min(0),
            }),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the upserted budget',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              budget: Budget,
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const body = data.body;
    const userId = c.get('userId');

    let id: number | undefined;
    if (body.scope === 'category') {
      if (!body.category_id) {
        return Response.json(
          {
            success: false,
            error: "category_id is required when scope='category'",
          },
          { status: 400 },
        );
      }
      const result = await c.env.DB.prepare(
        `INSERT INTO budgets (user_id, month, scope, category_id, amount)
				 VALUES (?, ?, 'category', ?, ?)
				 ON CONFLICT(user_id, month, category_id) WHERE scope = 'category'
				 DO UPDATE SET amount = excluded.amount,
				               updated_at = CURRENT_TIMESTAMP
				 RETURNING id`,
      )
        .bind(userId, body.month, body.category_id, body.amount)
        .first<{ id: number }>();
      id = result?.id;
    } else {
      const result = await c.env.DB.prepare(
        `INSERT INTO budgets (user_id, month, scope, category_id, amount)
				 VALUES (?, ?, 'general', NULL, ?)
				 ON CONFLICT(user_id, month) WHERE scope = 'general'
				 DO UPDATE SET amount = excluded.amount,
				               updated_at = CURRENT_TIMESTAMP
				 RETURNING id`,
      )
        .bind(userId, body.month, body.amount)
        .first<{ id: number }>();
      id = result?.id;
    }

    if (!id) {
      return Response.json(
        { success: false, error: 'Could not save budget' },
        { status: 500 },
      );
    }

    const budget = await c.env.DB.prepare(
      `SELECT b.id, b.month, b.scope, b.category_id, b.amount,
			        b.created_at, b.updated_at,
			        c.name as category_name, c.icon as category_icon
			 FROM budgets b
			 LEFT JOIN categories c ON c.id = b.category_id
			 WHERE b.id = ?`,
    )
      .bind(id)
      .first();

    return { success: true, budget };
  }
}
