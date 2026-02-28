import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class TransactionDelete extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Delete a Transaction",
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

		const existing = await c.env.DB.prepare(`SELECT id FROM transactions WHERE id = ? AND user_id = ?`).bind(id, userId).first();
		if (!existing) {
			return c.json({ success: false, error: "Transaction not found" }, 404);
		}

		await c.env.DB.prepare(`DELETE FROM transactions WHERE id = ? AND user_id = ?`).bind(id, userId).run();

		return {
			success: true,
		};
	}
}
