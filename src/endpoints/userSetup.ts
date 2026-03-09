import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class UserSetup extends OpenAPIRoute {
	schema = {
		tags: ["User"],
		summary: "Setup default user data (Accounts, Categories, Tags)",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Success or already setup",
				content: {
					"application/json": {
						schema: z.object({
							setup: z.boolean(),
							message: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");
		const db = c.env.DB;

		try {
			// Check if user already has data
			const accountsCount: any = await db.prepare("SELECT COUNT(*) as count FROM accounts WHERE user_id = ?").bind(userId).first();
			const categoriesCount: any = await db.prepare("SELECT COUNT(*) as count FROM categories WHERE user_id = ?").bind(userId).first();

			if (accountsCount.count > 0 || categoriesCount.count > 0) {
				return { setup: false, message: "User already configured" };
			}

			// Default Accounts
			const defaultAccounts = [
				{ name: "Efectivo", type: "cash" },
				{ name: "Cuenta Corriente", type: "checking" },
			];

			// Default Tags
			const defaultTags = [{ name: "Esencial" }, { name: "Gusto" }];

			// Default Categories
			const defaultCategories = [
				{ name: "Sueldo", type: "income", icon: "💰" },
				{ name: "Supermercado", type: "expense", icon: "🛒" },
				{ name: "Transporte", type: "expense", icon: "🚌" },
				{ name: "Servicios", type: "expense", icon: "⚡" },
				{ name: "Ocio", type: "expense", icon: "🎉" },
				{ name: "Salud", type: "expense", icon: "⚕️" },
			];

			// Insert Accounts
			const accountStatements = defaultAccounts.map((acc) =>
				db.prepare(`INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, 0)`).bind(userId, acc.name, acc.type)
			);

			// Insert Tags
			const tagStatements = defaultTags.map((tag) =>
				db.prepare(`INSERT INTO tags (user_id, name) VALUES (?, ?)`).bind(userId, tag.name)
			);

			// Insert Categories
			const categoryStatements = defaultCategories.map((cat) =>
				db.prepare(`INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)`).bind(userId, cat.name, cat.type, cat.icon)
			);

			await db.batch([...accountStatements, ...tagStatements, ...categoryStatements]);

			return { setup: true, message: "Default configuration applied successfully" };
		} catch (error: any) {
			return Response.json({ success: false, error: error.message }, { status: 500 });
		}
	}
}
