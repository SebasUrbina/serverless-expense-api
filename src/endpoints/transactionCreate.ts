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

		// 1. Insert Transaction First
		const txResult = await c.env.DB.prepare(
			`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date) 
			 VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
		)
			.bind(t.title, t.amount, t.category_id, t.type, t.account_id, userId, t.date)
			.first() as any;

		// 2. Insert Tags if provided
		if (t.tag_ids && t.tag_ids.length > 0) {
			const tagStmts = t.tag_ids.map(tagId =>
				c.env.DB.prepare(`INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`).bind(txResult.id, tagId)
			);
			await c.env.DB.batch(tagStmts);
		}

		// Merge for frontend
		const finalResult = { ...txResult, tag_ids: t.tag_ids || [] };

		return {
			success: true,
			transaction: finalResult,
		};
	}
}
