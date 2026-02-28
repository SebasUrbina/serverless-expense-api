import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../types";

export class TransactionFetch extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Get a Transaction by ID",
		request: {
			params: z.object({
				id: Num({ description: "Transaction ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns a single transaction",
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
		const userId = c.get("userId");

		const result = await c.env.DB.prepare(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`).bind(id, userId).first();

		if (!result) {
			return c.json({ success: false, error: "Transaction not found" }, 404);
		}

		return {
			success: true,
			transaction: result,
		};
	}
}
