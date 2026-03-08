import { Str, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class TransactionKpiSummary extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Get Key Performance Indicators for Transactions",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			query: z.object({
				month: Str({
					description: "Optional month filter in YYYY-MM format",
					required: false,
				}),
			}),
		},
		responses: {
			"200": {
				description: "Returns advanced KPIs",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							kpis: z.object({
								largest_expense: z.number().nullable(),
								largest_expense_title: z.string().nullable(),
								largest_income: z.number().nullable(),
								transaction_count: z.number(),
							}),
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

		let baseFilter = `WHERE user_id = ?`;
        const binds: any[] = [userId];

        if (month) {
            baseFilter += ` AND strftime('%Y-%m', date) = ?`;
            binds.push(month);
        }

		const query = `
			SELECT 
                (SELECT amount FROM transactions ${baseFilter} AND type = 'expense' ORDER BY amount DESC LIMIT 1) as largest_expense,
                (SELECT title FROM transactions ${baseFilter} AND type = 'expense' ORDER BY amount DESC LIMIT 1) as largest_expense_title,
                (SELECT amount FROM transactions ${baseFilter} AND type = 'income' ORDER BY amount DESC LIMIT 1) as largest_income,
                (SELECT count(*) FROM transactions ${baseFilter}) as transaction_count
		`;

		const result = await c.env.DB.prepare(query).bind(...binds, ...binds, ...binds, ...binds).first() as any;
		
		return {
			success: true,
			kpis: {
                largest_expense: result.largest_expense || 0,
                largest_expense_title: result.largest_expense_title || null,
                largest_income: result.largest_income || 0,
                transaction_count: result.transaction_count || 0,
            },
		};
	}
}
