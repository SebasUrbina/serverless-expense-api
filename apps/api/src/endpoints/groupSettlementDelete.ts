import { Bool, OpenAPIRoute, Num } from 'chanfana';
import { z } from 'zod';
import { ErrorResponse, type AppContext } from '../types';

export class GroupSettlementDelete extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Undo a payment between members',
    description: 'Only the member who recorded the payment can undo it.',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({ group_id: Num(), id: Num() }),
    },
    responses: {
      '200': {
        description: 'Payment removed',
        content: {
          'application/json': { schema: z.object({ success: Bool() }) },
        },
      },
      '404': {
        description: 'Not found or recorded by someone else',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');

    const deleted = await c.env.DB.prepare(
      `DELETE FROM group_settlements
       WHERE id = ? AND group_id = ? AND created_by = ? RETURNING id`,
    )
      .bind(data.params.id, data.params.group_id, userId)
      .first();

    if (!deleted) {
      return c.json(
        { success: false, error: 'Payment not found or not recorded by you' },
        404,
      );
    }
    return { success: true };
  }
}
