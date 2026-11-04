import { Bool, OpenAPIRoute, Num, Str } from 'chanfana';
import { z } from 'zod';
import { ErrorResponse, GroupSettlement, type AppContext } from '../types';
import { todayLocal } from '../utils/date';
import { monthEnd } from '../services/monthlyAvailability';

export class GroupSettlementList extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Payments between members of a group in a month',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({ group_id: Num() }),
      query: z.object({
        month: Str({
          required: false,
          description: 'YYYY-MM, defaults to this month',
        }),
      }),
    },
    responses: {
      '200': {
        description: 'Payments, newest first',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              settlements: z.array(GroupSettlement),
            }),
          },
        },
      },
      '403': {
        description: 'Not a member',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');
    const groupId = data.params.group_id;
    const month = /^\d{4}-\d{2}$/.test(data.query.month ?? '')
      ? data.query.month!
      : todayLocal().slice(0, 7);

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

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM group_settlements
       WHERE group_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, id DESC`,
    )
      .bind(groupId, `${month}-01`, monthEnd(month))
      .all();

    return { success: true, settlements: results };
  }
}
