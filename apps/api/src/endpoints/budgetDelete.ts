import { Str, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';

export class BudgetDelete extends OpenAPIRoute {
  schema = {
    tags: ['Budgets'],
    summary: 'Delete a budget',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({
        id: Str({ description: 'Budget ID' }),
      }),
    },
    responses: {
      '200': {
        description: 'Budget deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;
    const userId = c.get('userId');

    const result = await c.env.DB.prepare(
      `DELETE FROM budgets WHERE id = ? AND user_id = ?`,
    )
      .bind(Number(id), userId)
      .run();

    if (result.meta.changes === 0) {
      return Response.json(
        { success: false, error: 'Budget not found' },
        { status: 404 },
      );
    }

    return { success: true };
  }
}
