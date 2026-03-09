import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../types";

export class TransactionUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Update an existing Transaction",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				id: Num({ description: "Transaction ID" }),
			}),
			body: {
				content: {
					"application/json": {
						schema: Transaction.omit({ id: true, created_at: true }).partial(),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the updated transaction",
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
			"404": {
				description: "Transaction not found",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							error: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;
		const updates = data.body;
		const userId = c.get("userId");

		// Fetch existing
		const existing = await c.env.DB.prepare(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`).bind(id, userId).first() as any;
		if (!existing) {
			return c.json({ success: false, error: "Transaction not found" }, 404);
		}

		const newTitle = updates.title ?? existing.title;
		const newAmount = updates.amount ?? existing.amount;
		const newCategory = updates.category_id ?? existing.category_id;
		const newType = updates.type ?? existing.type;
		const newAccount = updates.account_id ?? existing.account_id;
		const newDate = updates.date ?? existing.date;
		const newIsShared = updates.is_shared !== undefined ? (updates.is_shared ? 1 : 0) : existing.is_shared;
		const newGroupId = updates.group_id !== undefined ? updates.group_id : existing.group_id;

		// Fetch existing tags to prefill if no change
		let currentTagIds: number[] = [];
		if (updates.tag_ids === undefined) {
			const existingTagsResult = await c.env.DB.prepare(`SELECT tag_id FROM transaction_tags WHERE transaction_id = ?`).bind(id).all();
			currentTagIds = existingTagsResult.results.map((r: any) => r.tag_id);
		}

		const txResult = await c.env.DB.prepare(
			`UPDATE transactions SET title = ?, amount = ?, category_id = ?, type = ?, account_id = ?, date = ?, is_shared = ?, group_id = ? WHERE id = ? AND user_id = ? RETURNING *`
		)
			.bind(newTitle, newAmount, newCategory, newType, newAccount, newDate, newIsShared, newGroupId, id, userId)
			.first();

		if (updates.tag_ids !== undefined) {
			// Clear existing tags
			const stmts = [c.env.DB.prepare(`DELETE FROM transaction_tags WHERE transaction_id = ?`).bind(id)];
			// Insert new map
			for (const tId of updates.tag_ids) {
				stmts.push(c.env.DB.prepare(`INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`).bind(id, tId));
			}
			await c.env.DB.batch(stmts);
		}

		// Handle splits update
		let finalSplits: any[] = [];
		if (updates.splits !== undefined) {
			// Clear existing splits and re-insert
			const splitStmts: any[] = [c.env.DB.prepare(`DELETE FROM transaction_splits WHERE transaction_id = ?`).bind(id)];
			if (newIsShared && updates.splits.length > 0) {
				for (const split of updates.splits) {
					const splitAmount = Math.round((newAmount * split.percentage) / 100);
					splitStmts.push(
						c.env.DB.prepare(
							`INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`
						).bind(id, split.user_id, splitAmount, split.percentage)
					);
				}
			}
			await c.env.DB.batch(splitStmts);
		}

		// Fetch current splits for response
		const splitsResult = await c.env.DB.prepare(`
			SELECT ts.*, sgm.nickname 
			FROM transaction_splits ts
			LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
			WHERE ts.transaction_id = ?
		`).bind(newGroupId, id).all();
		finalSplits = splitsResult.results;

		const finalTags = updates.tag_ids !== undefined ? updates.tag_ids : currentTagIds;
		
		return {
			success: true,
			transaction: { ...txResult, tag_ids: finalTags, splits: finalSplits },
		};
	}
}
