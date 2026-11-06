import { Bool, OpenAPIRoute, Num } from 'chanfana';
import { z } from 'zod';
import { ErrorResponse, type AppContext } from '../types';

const errorContent = { 'application/json': { schema: ErrorResponse } };

export class GroupSettlementDelete extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Undo a payment between members',
    description:
      'The payer or the receiver can undo it, while they are members of the group.',
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
      '403': { description: 'Not a member', content: errorContent },
      '404': {
        description: 'Not found, or the caller is not the payer or receiver',
        content: errorContent,
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');
    const { group_id: groupId, id } = data.params;

    const membership = await c.env.DB.prepare(
      `SELECT 1 FROM shared_group_members WHERE group_id = ? AND user_id = ?`,
    )
      .bind(groupId, userId)
      .first();
    if (!membership) {
      return c.json(
        { success: false, error: 'Not a member of this group' },
        403,
      );
    }

    const deleted = await c.env.DB.prepare(
      `DELETE FROM group_settlements
       WHERE id = ?1 AND group_id = ?2 AND (from_user_id = ?3 OR to_user_id = ?3)
       RETURNING id`,
    )
      .bind(id, groupId, userId)
      .first();

    if (!deleted) {
      return c.json(
        { success: false, error: 'Payment not found or not yours' },
        404,
      );
    }
    return { success: true };
  }
}
