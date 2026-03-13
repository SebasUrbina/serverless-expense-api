import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../../types";

export class ShortcutTransactionCreate extends OpenAPIRoute {
	schema = {
		tags: ["Shortcuts", "Transactions"],
		summary: "Create a Transaction via iOS Shortcuts",
		description: "Simplified transaction creation endpoint tailored for iOS Shortcuts. Accepts category and account names instead of IDs, auto-sets current date, and skips complex features.",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							title: z.string().min(1, "Title is required"),
							amount: z.number().positive("Amount must be positive"),
							type: z.enum(["expense", "income"]),
							category_name: z.string().min(1, "Category name is required"),
							account_name: z.string().min(1, "Account name is required"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created transaction",
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
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const t = data.body;
		const userId = c.get("userId");

		// 1. Resolve Category ID from Name
		const category = await c.env.DB.prepare(
			`SELECT id FROM categories 
			 WHERE user_id = ? AND type = ? 
			 AND (name = ? OR icon || ' ' || name = ?)`
		).bind(userId, t.type, t.category_name, t.category_name).first<{id: number}>();

		if (!category) {
			return c.json({ success: false, error: `Category '${t.category_name}' not found for type '${t.type}'` }, 400);
		}

		// 2. Resolve Account ID from Name
		const account = await c.env.DB.prepare(
			`SELECT id FROM accounts WHERE user_id = ? AND name = ?`
		).bind(userId, t.account_name).first<{id: number}>();

		if (!account) {
			return c.json({ success: false, error: `Account '${t.account_name}' not found` }, 400);
		}

		// Auto set current Date in UTC (YYYY-MM-DD format based on timezone or UTC, simplified to today's date)
		const today = new Date().toISOString().split("T")[0];

		// 3. Insert Transaction (simplified for Shortcuts)
		const txResult = await c.env.DB.prepare(
			`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL) RETURNING *`
		)
			.bind(t.title, t.amount, category.id, t.type, account.id, userId, today)
			.first() as any;

		return {
			success: true,
			transaction: txResult,
		};
	}
}
