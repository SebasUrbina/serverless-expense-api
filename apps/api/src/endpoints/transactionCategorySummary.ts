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
									category_id: z.number().optional(),
									category_icon: z.string().optional(),
									amount: z.number(),
									previous_amount: z.number().optional(),
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

		let prevMonth = "";
		if (month) {
			const d = new Date(`${month}-01T00:00:00Z`);
			d.setUTCMonth(d.getUTCMonth() - 1);
			prevMonth = d.toISOString().substring(0, 7);
		}

		let query = `
			SELECT 
				c.name as category,
				t.category_id as category_id,
				c.icon as category_icon,
                t.type as type,
		`;

		if (month) {
			query += `
				SUM(CASE WHEN strftime('%Y-%m', t.date) = ? THEN t.amount ELSE 0 END) as amount,
				SUM(CASE WHEN strftime('%Y-%m', t.date) = ? THEN t.amount ELSE 0 END) as previous_amount
			`;
		} else {
			query += `
				SUM(t.amount) as amount,
				0 as previous_amount
			`;
		}

		query += `
			FROM transactions t
			LEFT JOIN categories c ON t.category_id = c.id
			WHERE t.user_id = ?
		`;

		const binds: any[] = [];
		if (month) {
			binds.push(month, prevMonth);
		}
		binds.push(userId);

		if (month) {
			query += ` AND strftime('%Y-%m', t.date) IN (?, ?)`;
			binds.push(month, prevMonth);
		} else {
			query += ` AND t.date <= date('now', 'localtime')`;
		}

        if (type) {
            query += ` AND t.type = ?`;
            binds.push(type);
        }

        query += ` GROUP BY t.category_id, t.type HAVING amount > 0 OR previous_amount > 0 ORDER BY amount DESC`;

		const result = await c.env.DB.prepare(query).bind(...binds).all();
		
		const summary = result.results.map((row: any) => ({
			category: row.category as string,
			category_id: row.category_id as number,
			category_icon: row.category_icon as string | undefined,
			amount: row.amount as number,
			previous_amount: row.previous_amount as number,
            type: row.type as string,
		}));

		return {
			success: true,
			summary,
		};
	}
}
