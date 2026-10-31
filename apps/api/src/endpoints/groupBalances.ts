import { Bool, OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { GroupBalancesResponse, type AppContext } from '../types';

export class GroupBalances extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Get shared expense balances for all groups (for a given month)',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        month: Str({
          required: false,
          description: 'YYYY-MM filter, defaults to current month',
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
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');

    // Default to current month
    const now = new Date();
    const month =
      data.query.month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // Get all groups user is a member of
    const groupsResult = await c.env.DB.prepare(
      `
			SELECT g.id, g.name FROM shared_groups g
			INNER JOIN shared_group_members m ON g.id = m.group_id
			WHERE m.user_id = ?
		`,
    )
      .bind(userId)
      .all();

    const balances = [];

    const groups = groupsResult.results as any[];
    // One query per group: the month's shared transactions are scanned once and
    // reused for every member's paid/share totals.
    const perGroup = groups.length
      ? await c.env.DB.batch(
          groups.map((group) =>
            c.env.DB.prepare(
              `
					WITH tx AS MATERIALIZED (
						SELECT id, user_id, amount FROM transactions
						WHERE group_id = ? AND is_shared = 1 AND date >= ? AND date <= ?
					), shares AS MATERIALIZED (
						SELECT s.user_id, SUM(s.amount) as total
						FROM tx JOIN transaction_splits s ON s.transaction_id = tx.id
						GROUP BY s.user_id
					), paid AS MATERIALIZED (
						SELECT user_id, SUM(amount) as total FROM tx GROUP BY user_id
					)
					SELECT
						m.user_id,
						m.nickname,
						COALESCE(paid.total, 0) as total_paid,
						COALESCE(shares.total, 0) as total_share,
						(SELECT COUNT(*) FROM tx) as transaction_count
					FROM shared_group_members m
					LEFT JOIN paid ON paid.user_id = m.user_id
					LEFT JOIN shares ON shares.user_id = m.user_id
					WHERE m.group_id = ?
				`,
            ).bind(group.id, startDate, endDate, group.id),
          ),
        )
      : [];

    groups.forEach((group, i) => {
      const rows = (perGroup[i]?.results ?? []) as any[];
      balances.push({
        group_id: group.id,
        group_name: group.name,
        month,
        transaction_count: rows[0]?.transaction_count ?? 0,
        members: rows.map((member) => ({
          user_id: member.user_id,
          nickname: member.nickname,
          total_paid: member.total_paid,
          total_share: member.total_share,
          // Positive = they overpaid (others owe them), Negative = they underpaid (they owe others)
          net: member.total_paid - member.total_share,
        })),
      });
    });

    return {
      success: true,
      balances,
    };
  }
}
