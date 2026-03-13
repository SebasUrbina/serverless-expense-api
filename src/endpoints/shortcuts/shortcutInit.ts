import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Account, Category } from "../../types";

const AccountWithDisplay = Account.extend({ display_name: z.string() });
const CategoryWithDisplay = Category.extend({ display_name: z.string() });

export class ShortcutInit extends OpenAPIRoute {
	schema = {
		tags: ["Shortcuts"],
		summary: "Fetch initialization data for iOS Shortcuts",
		description: "Returns all active accounts and categories formatted optimally for iOS Shortcuts usage.",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Returns initialization data",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							accounts: z.array(AccountWithDisplay),
							categories: z.object({
								expense: z.array(CategoryWithDisplay),
								income: z.array(CategoryWithDisplay),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");

		// Fetch accounts
		const accountsResult = await c.env.DB.prepare(
			`SELECT * FROM accounts WHERE user_id = ? ORDER BY type, name ASC`
		).bind(userId).all();

		// Fetch categories
		const categoriesResult = await c.env.DB.prepare(
			`SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC`
		).bind(userId).all();

		const allCategories = categoriesResult.results as any[];
		const allAccounts = accountsResult.results as any[];

		// Map to add display_name
		const formattedAccounts = allAccounts.map(a => ({ ...a, display_name: a.name }));
		const formattedCategories = allCategories.map(cat => ({
			...cat,
			display_name: cat.icon ? `${cat.icon} ${cat.name}` : cat.name
		}));

		// Group categories by type
		const groupedCategories = {
			expense: formattedCategories.filter((cat) => cat.type === "expense"),
			income: formattedCategories.filter((cat) => cat.type === "income"),
		};

		return {
			success: true,
			accounts: formattedAccounts,
			categories: groupedCategories,
		};
	}
}
