import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../types";

export class TransactionList extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "List Transactions",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			query: z.object({
				search: Str({
					description: "Search by title (case-insensitive)",
					required: false,
				}),
				category: Str({
					description: "Filter by category",
					required: false,
				}),
				type: Str({
					description: "Filter by type (expense/income)",
					required: false,
				}),
				startDate: Str({
					description: "Filter transactions from this date (YYYY-MM-DD)",
					required: false,
				}),
				endDate: Str({
					description: "Filter transactions up to this date (YYYY-MM-DD)",
					required: false,
				}),
				page: Num({
					description: "Page number for pagination",
					required: false,
					default: 1,
				}),
				limit: Num({
					description: "Number of items per page",
					required: false,
					default: 20,
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
									hasMore: Bool(),
									nextPage: Num().nullable(),
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
		const { search, category, type, startDate, endDate, page, limit } = data.query;
		const userId = c.get("userId");

		let query = `SELECT * FROM transactions WHERE user_id = ?`;
		const binds: any[] = [userId];

		if (search) {
			query += ` AND LOWER(title) LIKE LOWER(?)`;
			binds.push(`%${search}%`);
		}
		if (category) {
			query += ` AND category = ?`;
			binds.push(category);
		}
		if (type) {
			query += ` AND type = ?`;
			binds.push(type);
		}
		if (startDate) {
			query += ` AND date >= ?`;
			binds.push(startDate);
		}
		if (endDate) {
			query += ` AND date <= ?`;
			binds.push(endDate);
		}

		query += ` ORDER BY date DESC, created_at DESC`;

		// Pagination logic
		const safePage = Math.max(1, page || 1);
		const safeLimit = Math.max(1, Math.min(100, limit || 20)); // Max 100 items per page
		const offset = (safePage - 1) * safeLimit;

		// Fetch 1 extra item to easily check if there are more pages
		query += ` LIMIT ? OFFSET ?`;
		binds.push(safeLimit + 1, offset);

		const result = await c.env.DB.prepare(query).bind(...binds).all();
		const allTx = result.results;

		const hasMore = allTx.length > safeLimit;
		const returnTx = hasMore ? allTx.slice(0, safeLimit) : allTx;

		return {
			success: true,
			transactions: returnTx,
			hasMore: hasMore,
			nextPage: hasMore ? safePage + 1 : null,
		};
	}
}
