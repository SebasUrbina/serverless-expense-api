import { Str, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class TransactionCategorySummary extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Get Transaction Summary Grouped by Category",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			query: z.object({
				month: Str({
					description: "Optional month filter in YYYY-MM format",
					required: false,
				}),
				type: Str({
					description: "Optional type filter (expense/income)",
					required: false,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns a summary of transactions grouped by category",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							summary: z.array(
								z.object({
									category: z.string(),
									amount: z.number(),
									type: z.string(),
								})
							),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { month, type } = data.query;
		const userId = c.get("userId");

		let query = `
			SELECT 
				c.name as category,
                t.type as type,
				SUM(t.amount) as amount
			FROM transactions t
			LEFT JOIN categories c ON t.category_id = c.id
			WHERE t.user_id = ?
		`;
        const binds: any[] = [userId];

        if (month) {
            query += ` AND strftime('%Y-%m', t.date) = ?`;
            binds.push(month);
        }

        if (type) {
            query += ` AND t.type = ?`;
            binds.push(type);
        }

        query += ` GROUP BY t.category_id, t.type ORDER BY amount DESC`;

		const result = await c.env.DB.prepare(query).bind(...binds).all();
		
		const summary = result.results.map((row: any) => ({
			category: row.category as string,
			amount: row.amount as number,
            type: row.type as string,
		}));

		return {
			success: true,
			summary,
		};
	}
}
