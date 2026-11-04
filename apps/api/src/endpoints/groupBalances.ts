import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { GroupBalancesResponse, type AppContext } from '../types';
import { todayLocal } from '../utils/date';
import { monthEnd } from '../services/monthlyAvailability';
import { computeSettlementPairs } from '../utils/settlements';

export class GroupBalances extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary:
      'Accumulated balance of every group, with the shared totals of a month',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        month: Str({
          required: false,
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
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');

    const today = todayLocal();
    const month = /^\d{4}-\d{2}$/.test(data.query.month ?? '')
      ? data.query.month!
      : today.slice(0, 7);
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

    // One statement per group: its shared movements up to today are scanned once
    // and reused for the accumulated and the month totals of every member.
    const perGroup = groups.length
      ? await c.env.DB.batch(
          groups.map((group) =>
            c.env.DB.prepare(
              `
					WITH tx AS MATERIALIZED (
						SELECT id, user_id, amount, date FROM transactions
						WHERE group_id = ?1 AND is_shared = 1 AND date <= ?2
					), shares AS MATERIALIZED (
						SELECT s.user_id,
							SUM(s.amount) AS total,
							SUM(CASE WHEN tx.date >= ?3 AND tx.date <= ?4 THEN s.amount ELSE 0 END) AS month_total
						FROM tx JOIN transaction_splits s ON s.transaction_id = tx.id
						GROUP BY s.user_id
					), paid AS MATERIALIZED (
						SELECT user_id,
							SUM(amount) AS total,
							SUM(CASE WHEN date >= ?3 AND date <= ?4 THEN amount ELSE 0 END) AS month_total
						FROM tx GROUP BY user_id
					), payments AS MATERIALIZED (
						SELECT from_user_id, to_user_id, amount, date FROM group_settlements
						WHERE group_id = ?1 AND date <= ?2
					), sent AS (
						SELECT from_user_id AS user_id, SUM(amount) AS total FROM payments GROUP BY from_user_id
					), received AS (
						SELECT to_user_id AS user_id, SUM(amount) AS total FROM payments GROUP BY to_user_id
					)
					SELECT
						m.user_id,
						m.nickname,
						COALESCE(paid.total, 0) AS total_paid,
						COALESCE(shares.total, 0) AS total_share,
						COALESCE(sent.total, 0) AS total_sent,
						COALESCE(received.total, 0) AS total_received,
						COALESCE(paid.month_total, 0) AS month_paid,
						COALESCE(shares.month_total, 0) AS month_share,
						(SELECT COUNT(*) FROM tx WHERE date >= ?3 AND date <= ?4) AS transaction_count,
						(SELECT COUNT(*) FROM payments WHERE date >= ?3 AND date <= ?4) AS settlement_count
					FROM shared_group_members m
					LEFT JOIN paid ON paid.user_id = m.user_id
					LEFT JOIN shares ON shares.user_id = m.user_id
					LEFT JOIN sent ON sent.user_id = m.user_id
					LEFT JOIN received ON received.user_id = m.user_id
					WHERE m.group_id = ?1
				`,
            ).bind(group.id, today, monthStart, monthLast),
          ),
        )
      : [];

    const balances = groups.map((group, i) => {
      const rows = (perGroup[i]?.results ?? []) as any[];
      const members = rows.map((m) => ({
        user_id: m.user_id,
        nickname: m.nickname,
        total_paid: m.total_paid,
        total_share: m.total_share,
        // Paying someone raises your balance; being paid lowers theirs.
        net: m.total_paid - m.total_share + m.total_sent - m.total_received,
        month_paid: m.month_paid,
        month_share: m.month_share,
      }));
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
