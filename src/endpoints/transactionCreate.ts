import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../types";

export class TransactionCreate extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Create a new Transaction",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: Transaction.omit({ id: true, created_at: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created transaction",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									transaction: Transaction,
								}),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const t = data.body;
		const userId = c.get("userId");

		const isShared = t.is_shared ? 1 : 0;
		const groupId = t.group_id || null;

		// Validate group membership if shared
		if (isShared && groupId) {
			const membership = await c.env.DB.prepare(
				`SELECT * FROM shared_group_members WHERE group_id = ? AND user_id = ?`
			).bind(groupId, userId).first();
			if (!membership) {
				return c.json({ success: false, error: "You are not a member of this group" }, 403);
			}
		}

		// 1. Insert Transaction
		const txResult = await c.env.DB.prepare(
			`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
		)
			.bind(t.title, t.amount, t.category_id, t.type, t.account_id, userId, t.date, isShared, groupId)
			.first() as any;

		// 2. Insert Tags if provided
		if (t.tag_ids && t.tag_ids.length > 0) {
			const tagStmts = t.tag_ids.map(tagId =>
				c.env.DB.prepare(`INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`).bind(txResult.id, tagId)
			);
			await c.env.DB.batch(tagStmts);
		}

		// 3. Insert Splits if shared
		let finalSplits: any[] = [];
		if (isShared && t.splits && t.splits.length > 0) {
			const splitStmts = t.splits.map(split => {
				const splitAmount = Math.round((t.amount * split.percentage) / 100);
				return c.env.DB.prepare(
					`INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`
				).bind(txResult.id, split.user_id, splitAmount, split.percentage);
			});
			await c.env.DB.batch(splitStmts);

			// Fetch splits with nicknames for response
			const splitsResult = await c.env.DB.prepare(`
				SELECT ts.*, sgm.nickname 
				FROM transaction_splits ts
				LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
				WHERE ts.transaction_id = ?
			`).bind(groupId, txResult.id).all();
			finalSplits = splitsResult.results;
		}

		// Merge for frontend
		const finalResult = { ...txResult, tag_ids: t.tag_ids || [], splits: finalSplits };

		return {
			success: true,
			transaction: finalResult,
		};
	}
}
