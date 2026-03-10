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
				category_id: Num({
					description: "Filter by category ID",
					required: false,
				}),
				tag_id: Num({
					description: "Filter by tag ID",
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
		const { search, category_id, tag_id, type, startDate, endDate, page, limit } = data.query;
		const userId = c.get("userId");

		let query = `
			SELECT 
				t.*, 
				c.name as category,
				c.icon as category_icon,
				a.name as account,
				(SELECT json_group_array(json_object('id', tt.tag_id, 'name', COALESCE(tg.name, 'Unknown'))) FROM transaction_tags tt LEFT JOIN tags tg ON tg.id = tt.tag_id WHERE tt.transaction_id = t.id) as tag_data,
				ts_me.amount as my_split_amount,
				ts_me.percentage as my_split_percentage,
				sg.name as group_name
			FROM transactions t
			LEFT JOIN categories c ON t.category_id = c.id
			LEFT JOIN accounts a ON t.account_id = a.id
			LEFT JOIN transaction_splits ts_me ON ts_me.transaction_id = t.id AND ts_me.user_id = ?
			LEFT JOIN shared_groups sg ON t.group_id = sg.id
			WHERE (t.user_id = ? OR t.id IN (SELECT transaction_id FROM transaction_splits WHERE user_id = ?))
		`;
		const binds: any[] = [userId, userId, userId];

		if (search) {
			query += ` AND LOWER(t.title) LIKE LOWER(?)`;
			binds.push(`%${search}%`);
		}
		if (category_id) {
			query += ` AND t.category_id = ?`;
			binds.push(category_id);
		}
		if (tag_id) {
			query += ` AND EXISTS (SELECT 1 FROM transaction_tags tt WHERE tt.transaction_id = t.id AND tt.tag_id = ?)`;
			binds.push(tag_id);
		}
		if (type) {
			query += ` AND t.type = ?`;
			binds.push(type);
		}
		if (startDate) {
			query += ` AND t.date >= ?`;
			binds.push(startDate);
		}
		if (endDate) {
			query += ` AND t.date <= ?`;
			binds.push(endDate);
		}

		query += ` ORDER BY t.date DESC, t.created_at DESC`;

		// Pagination logic
		const safePage = Math.max(1, page || 1);
		const safeLimit = Math.max(1, Math.min(100, limit || 20)); // Max 100 items per page
		const offset = (safePage - 1) * safeLimit;

		// Fetch 1 extra item to easily check if there are more pages
		query += ` LIMIT ? OFFSET ?`;
		binds.push(safeLimit + 1, offset);

		const result = await c.env.DB.prepare(query).bind(...binds).all();
		const allTx = result.results.map((tx: any) => {
			const tagData = JSON.parse(tx.tag_data || "[]");
			return {
				...tx,
				tag_ids: tagData.map((t: any) => t.id),
				tag_names: tagData.map((t: any) => t.name),
				tag_data: undefined,
				is_owner: tx.user_id === userId,
			};
		});

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
