import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class TransactionDelete extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Delete a Transaction",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				id: Num({ description: "Transaction ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Successfully deleted",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
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
		const userId = c.get("userId");

		// Check if user owns this transaction directly
		let tx = await c.env.DB.prepare(`SELECT id, is_shared, group_id FROM transactions WHERE id = ? AND user_id = ?`).bind(id, userId).first() as any;

		// If not the owner, check if it's a shared transaction and the user is a group member
		if (!tx) {
			tx = await c.env.DB.prepare(`
				SELECT t.id, t.is_shared, t.group_id FROM transactions t
				INNER JOIN shared_group_members sgm ON sgm.group_id = t.group_id AND sgm.user_id = ?
				WHERE t.id = ? AND t.is_shared = 1
			`).bind(userId, id).first() as any;
		}

		if (!tx) {
			return c.json({ success: false, error: "Transaction not found" }, 404);
		}

		// Clean up splits and tags first, then delete the transaction
		await c.env.DB.batch([
			c.env.DB.prepare(`DELETE FROM transaction_splits WHERE transaction_id = ?`).bind(id),
			c.env.DB.prepare(`DELETE FROM transaction_tags WHERE transaction_id = ?`).bind(id),
			c.env.DB.prepare(`DELETE FROM transactions WHERE id = ?`).bind(id),
		]);

		return {
			success: true,
		};
	}
}
