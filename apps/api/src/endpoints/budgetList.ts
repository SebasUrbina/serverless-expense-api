import { Str, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Budget } from "../types";

export class BudgetList extends OpenAPIRoute {
	schema = {
		tags: ["Budgets"],
		summary: "List budgets for a month",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			query: z.object({
				month: Str({
					description: "Month in YYYY-MM format",
					required: true,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns budgets for the month",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							budgets: z.array(Budget),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { month } = data.query;
		const userId = c.get("userId");

		const { results } = await c.env.DB.prepare(
			`SELECT b.id, b.month, b.scope, b.category_id, b.amount,
			        b.created_at, b.updated_at,
			        c.name as category_name, c.icon as category_icon
			 FROM budgets b
			 LEFT JOIN categories c ON c.id = b.category_id
			 WHERE b.user_id = ? AND b.month = ?
			 ORDER BY CASE b.scope WHEN 'general' THEN 0 ELSE 1 END, c.name ASC`
		).bind(userId, month).all();

		return {
			success: true,
			budgets: results,
		};
	}
}
