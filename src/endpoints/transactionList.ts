import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../types";

export class TransactionList extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "List Transactions",
		security: [{ BearerAuth: [] }],
		request: {
			query: z.object({
				category: Str({
					description: "Filter by category",
					required: false,
				}),
				type: Str({
					description: "Filter by type (expense/income)",
					required: false,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of transactions",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									transactions: Transaction.array(),
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
		const { category, type } = data.query;
		const userId = c.get("userId");

		let query = `SELECT * FROM transactions WHERE user_id = ?`;
		const binds: string[] = [userId];

		if (category) {
			query += ` AND category = ?`;
			binds.push(category);
		}
		if (type) {
			query += ` AND type = ?`;
			binds.push(type);
		}

		query += ` ORDER BY date DESC, created_at DESC`;

		const result = await c.env.DB.prepare(query).bind(...binds).all();

		return {
			success: true,
			transactions: result.results,
		};
	}
}
