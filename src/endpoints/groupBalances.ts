import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class GroupBalances extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "Get shared expense balances for all groups (for a given month)",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			query: z.object({
				month: Str({ required: false, description: "YYYY-MM filter, defaults to current month", example: "2026-03" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns balance summary per group",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							balances: z.array(z.any()),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const userId = c.get("userId");

		// Default to current month
		const now = new Date();
		const month = data.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		const startDate = `${month}-01`;
		const endDate = `${month}-31`;

		// Get all groups user is a member of
		const groupsResult = await c.env.DB.prepare(`
			SELECT g.id, g.name FROM shared_groups g
			INNER JOIN shared_group_members m ON g.id = m.group_id
			WHERE m.user_id = ?
		`).bind(userId).all();

		const balances = [];

		for (const group of groupsResult.results as any[]) {
			// Get members
			const membersResult = await c.env.DB.prepare(
				`SELECT user_id, nickname FROM shared_group_members WHERE group_id = ?`
			).bind(group.id).all();

			const members = membersResult.results as any[];

			// For each member, calculate:
			// 1. How much they PAID (created shared transactions)
			// 2. How much is their SHARE (sum of their splits)
			const memberBalances = [];

			for (const member of members) {
				// Total paid by this member (transactions they created in this group)
				const paidResult = await c.env.DB.prepare(`
					SELECT COALESCE(SUM(amount), 0) as total_paid
					FROM transactions
					WHERE user_id = ? AND group_id = ? AND is_shared = 1
					AND date >= ? AND date <= ?
				`).bind(member.user_id, group.id, startDate, endDate).first() as any;

				// Total share assigned to this member
				const shareResult = await c.env.DB.prepare(`
					SELECT COALESCE(SUM(ts.amount), 0) as total_share
					FROM transaction_splits ts
					INNER JOIN transactions t ON ts.transaction_id = t.id
					WHERE ts.user_id = ? AND t.group_id = ? AND t.is_shared = 1
					AND t.date >= ? AND t.date <= ?
				`).bind(member.user_id, group.id, startDate, endDate).first() as any;

				memberBalances.push({
					user_id: member.user_id,
					nickname: member.nickname,
					total_paid: paidResult.total_paid,
					total_share: shareResult.total_share,
					// Positive = they overpaid (others owe them), Negative = they underpaid (they owe others)
					net: paidResult.total_paid - shareResult.total_share,
				});
			}

			// Transaction count for this group this month
			const countResult = await c.env.DB.prepare(`
				SELECT COUNT(*) as count FROM transactions
				WHERE group_id = ? AND is_shared = 1 AND date >= ? AND date <= ?
			`).bind(group.id, startDate, endDate).first() as any;

			balances.push({
				group_id: group.id,
				group_name: group.name,
				month,
				transaction_count: countResult.count,
				members: memberBalances,
			});
		}

		return {
			success: true,
			balances,
		};
	}
}
