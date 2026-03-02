import { Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class TransactionMonthlySummary extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Get Monthly Transaction Summary",
		security: [{ BearerAuth: [] }],
		request: {
			query: z.object({
				months: Num({
					description: "Number of months to look back",
					required: false,
					default: 6,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns a summary of transactions grouped by month",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							summary: z.array(
								z.object({
									month: z.string(),
									total_expense: z.number(),
									total_income: z.number(),
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
		const { months } = data.query;
		const userId = c.get("userId");

		// We need to group by YYYY-MM
		// strftime('%Y-%m', date) gives us the month string
		const safeMonths = Math.max(1, Math.min(12, months || 6));
		
		const query = `
			SELECT 
				strftime('%Y-%m', date) as month,
				SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
				SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
			FROM transactions
			WHERE user_id = ?
			GROUP BY month
			ORDER BY month DESC
			LIMIT ?
		`;

		const result = await c.env.DB.prepare(query).bind(userId, safeMonths).all();
		
		// Map the results and return them in chronological order
		const summary = result.results.map((row: any) => ({
			month: row.month as string,
			total_expense: row.total_expense as number,
			total_income: row.total_income as number,
		})).reverse();

		return {
			success: true,
			summary,
		};
	}
}
