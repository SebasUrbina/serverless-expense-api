import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Account } from "../types";

export class AccountList extends OpenAPIRoute {
	schema = {
		tags: ["Accounts"],
		summary: "List all accounts",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Returns a list of accounts",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							accounts: z.array(Account),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");

		const { results } = await c.env.DB.prepare(
			`SELECT * FROM accounts WHERE user_id = ? ORDER BY type, name ASC`
		).bind(userId).all();

		return {
			success: true,
			accounts: results,
		};
	}
}