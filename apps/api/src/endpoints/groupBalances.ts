import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { GroupBalancesResponse, MonthParam, type AppContext } from '../types';
import { todayLocal } from '../utils/date';
import { monthEnd } from '../services/monthlyAvailability';
import { computeSettlementPairs } from '../utils/settlements';
import { groupBalanceStatement, membersFromRows } from '../utils/groupBalance';

export class GroupBalances extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary:
      'Accumulated balance of every group, with the shared totals of a month',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        month: MonthParam.optional().openapi({
          description: 'YYYY-MM for the month totals, defaults to this month',
          example: '2026-03',
        }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns balance summary per group',
        content: {
          'application/json': {
            schema: GroupBalancesResponse,
          },
        },
      },
      '400': { description: 'Invalid month' },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');

    const today = todayLocal();
    const month = data.query.month ?? today.slice(0, 7);
    const monthStart = `${month}-01`;
    const monthLast = monthEnd(month);

    const groups = (
      await c.env.DB.prepare(
        `SELECT g.id, g.name FROM shared_groups g
         INNER JOIN shared_group_members m ON g.id = m.group_id
         WHERE m.user_id = ?`,
      )
        .bind(userId)
        .all()
    ).results as { id: number; name: string }[];

    const perGroup = groups.length
      ? await c.env.DB.batch(
          groups.map((group) =>
            groupBalanceStatement(
              c.env.DB,
              group.id,
              today,
              monthStart,
              monthLast,
            ),
          ),
        )
      : [];

    const balances = groups.map((group, i) => {
      const rows = (perGroup[i]?.results ?? []) as any[];
      const members = membersFromRows(rows);
      return {
        group_id: group.id,
        group_name: group.name,
        month,
        transaction_count: rows[0]?.transaction_count ?? 0,
        settlement_count: rows[0]?.settlement_count ?? 0,
        members,
        pairs: computeSettlementPairs(members),
      };
    });

    return { success: true, balances };
  }
}
