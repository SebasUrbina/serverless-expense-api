import { Bool, OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { ErrorResponse, GroupSettleResponse, type AppContext } from "../types";

export class GroupSettle extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "Settle a group's balance for a given month",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				group_id: Num(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							month: Str({ description: "YYYY-MM to settle", example: "2026-03" }),
							account_id: Num({ description: "Account to record settlement against" }),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Settlement transaction created",
				content: {
					"application/json": {
						schema: GroupSettleResponse,
					},
				},
			},
			"400": {
				description: "Bad request (nothing to settle)",
				content: {
					"application/json": {
						schema: ErrorResponse,
					},
				},
			},
			"403": {
				description: "Forbidden (not a member)",
				content: {
					"application/json": {
						schema: ErrorResponse,
					},
				},
			},
			"404": {
				description: "Group not found",
				content: {
					"application/json": {
						schema: ErrorResponse,
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const userId = c.get("userId");
		const groupId = data.params.group_id;
		const { month, account_id } = data.body;

		// Verify caller is a member
		const membership = await c.env.DB.prepare(
			`SELECT * FROM shared_group_members WHERE group_id = ? AND user_id = ?`
		).bind(groupId, userId).first();
		if (!membership) {
			return c.json({ success: false, error: "Not a member of this group" }, 403);
		}

		// Get group name
		const group = await c.env.DB.prepare(`SELECT name FROM shared_groups WHERE id = ?`).bind(groupId).first() as any;
		if (!group) {
			return c.json({ success: false, error: "Group not found" }, 404);
		}

		const startDate = `${month}-01`;
		const endDate = `${month}-31`;

		// Calculate balances for each member
		const membersResult = await c.env.DB.prepare(
			`SELECT user_id, nickname FROM shared_group_members WHERE group_id = ?`
		).bind(groupId).all();

		const members = membersResult.results as any[];
		const memberBalances: { user_id: string; nickname: string; net: number }[] = [];

		for (const member of members) {
			const paidResult = await c.env.DB.prepare(`
				SELECT COALESCE(SUM(amount), 0) as total_paid
				FROM transactions
				WHERE user_id = ? AND group_id = ? AND is_shared = 1
				AND date >= ? AND date <= ?
			`).bind(member.user_id, groupId, startDate, endDate).first() as any;

			const shareResult = await c.env.DB.prepare(`
				SELECT COALESCE(SUM(ts.amount), 0) as total_share
				FROM transaction_splits ts
				INNER JOIN transactions t ON ts.transaction_id = t.id
				WHERE ts.user_id = ? AND t.group_id = ? AND t.is_shared = 1
				AND t.date >= ? AND t.date <= ?
			`).bind(member.user_id, groupId, startDate, endDate).first() as any;

			memberBalances.push({
				user_id: member.user_id,
				nickname: member.nickname,
				net: paidResult.total_paid - shareResult.total_share,
			});
		}

		// Find debtor (most negative net) and creditor (most positive net)
		const sorted = [...memberBalances].sort((a, b) => a.net - b.net);
		const debtor = sorted[0]; // most negative net
		const creditor = sorted[sorted.length - 1]; // most positive net
		const settlementAmount = Math.abs(debtor.net);

		if (settlementAmount === 0) {
			return c.json({ success: false, error: "Nothing to settle — balances are even" }, 400);
		}

		const today = new Date().toISOString().split("T")[0];

		// === Minimum Cash Flow Algorithm ===
		// Iteratively pair the biggest debtor with the biggest creditor
		// until all nets are zero.
		const nets = memberBalances.map(m => ({ ...m })); // clone
		const settlements: { debtor: string; debtorId: string; creditor: string; creditorId: string; amount: number }[] = [];

		while (true) {
			// Find max creditor and max debtor
			let maxCreditor = nets[0], maxDebtor = nets[0];
			for (const m of nets) {
				if (m.net > maxCreditor.net) maxCreditor = m;
				if (m.net < maxDebtor.net) maxDebtor = m;
			}

			// If both are ~0, we're done
			if (Math.abs(maxDebtor.net) < 1 && Math.abs(maxCreditor.net) < 1) break;

			// Settle the minimum of the two
			const amount = Math.min(Math.abs(maxDebtor.net), maxCreditor.net);
			if (amount < 1) break;

			settlements.push({
				debtor: maxDebtor.nickname,
				debtorId: maxDebtor.user_id,
				creditor: maxCreditor.nickname,
				creditorId: maxCreditor.user_id,
				amount: Math.round(amount),
			});

			// Update nets
			maxDebtor.net += amount;
			maxCreditor.net -= amount;
		}

		if (settlements.length === 0) {
			return c.json({ success: false, error: "Nothing to settle — balances are even" }, 400);
		}

		// Create transactions for each settlement pair
		const createdSettlements = [];

		for (const s of settlements) {
			// 1. Shared expense: debtor pays, split 100% to creditor (zeros shared balance)
			const debtorTx = await c.env.DB.prepare(
				`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?) RETURNING *`
			).bind(
				`💸 Saldo — ${group.name}`,
				s.amount,
				1,
				"expense",
				account_id,
				s.debtorId,
				today,
				groupId,
			).first() as any;

			await c.env.DB.batch([
				c.env.DB.prepare(
					`INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`
				).bind(debtorTx.id, s.creditorId, s.amount, 100),
				c.env.DB.prepare(
					`INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`
				).bind(debtorTx.id, s.debtorId, 0, 0),
			]);

			// 2. Income for creditor (personal, doesn't affect shared balance)
			await c.env.DB.prepare(
				`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)`
			).bind(
				`💸 Saldo recibido — ${group.name}`,
				s.amount,
				1,
				"income",
				account_id,
				s.creditorId,
				today,
			).run();

			createdSettlements.push({
				debtor: s.debtor,
				creditor: s.creditor,
				amount: s.amount,
			});
		}

		return {
			success: true,
			settlements: createdSettlements,
		};
	}
}
