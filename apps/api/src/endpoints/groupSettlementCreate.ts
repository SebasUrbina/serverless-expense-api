import { Bool, OpenAPIRoute, Num, Str } from 'chanfana';
import { z } from 'zod';
import { ErrorResponse, GroupSettlement, type AppContext } from '../types';
import { todayLocal } from '../utils/date';

const errorContent = { 'application/json': { schema: ErrorResponse } };

export class GroupSettlementCreate extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Record a payment between two members of a group',
    description:
      'Lowers the debt of `from_user_id` with `to_user_id`. It is not an expense or income: budgets, categories and summaries are unchanged. The caller must be one of the two members.',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({ group_id: Num() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              from_user_id: Str({ description: 'Member who pays' }),
              to_user_id: Str({ description: 'Member who receives' }),
              amount: z.number().int().positive().max(1_000_000_000).openapi({
                description: 'Whole pesos; may be less than the debt',
                example: 18000,
              }),
              date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .optional()
                .openapi({ description: 'YYYY-MM-DD, defaults to today' }),
            }),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Payment recorded',
        content: {
          'application/json': {
            schema: z.object({ success: Bool(), settlement: GroupSettlement }),
          },
        },
      },
      '400': { description: 'Invalid members', content: errorContent },
      '403': {
        description: 'Not one of the two members',
        content: errorContent,
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');
    const groupId = data.params.group_id;
    const { from_user_id, to_user_id, amount } = data.body;
    const date = data.body.date ?? todayLocal();

    if (from_user_id === to_user_id) {
      return c.json(
        { success: false, error: 'A member cannot pay themselves' },
        400,
      );
    }
    if (userId !== from_user_id && userId !== to_user_id) {
      return c.json(
        {
          success: false,
          error: 'Only the payer or the receiver can record it',
        },
        403,
      );
    }

    const members = await c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM shared_group_members
       WHERE group_id = ? AND user_id IN (?, ?)`,
    )
      .bind(groupId, from_user_id, to_user_id)
      .first<{ n: number }>();
    if ((members?.n ?? 0) < 2) {
      return c.json(
        { success: false, error: 'Both people must be members of the group' },
        400,
      );
    }

    const settlement = await c.env.DB.prepare(
      `INSERT INTO group_settlements (group_id, from_user_id, to_user_id, amount, date, created_by)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    )
      .bind(groupId, from_user_id, to_user_id, amount, date, userId)
      .first();

    return { success: true, settlement };
  }
}
