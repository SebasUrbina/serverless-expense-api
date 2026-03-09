import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Account } from "../types";

export class AccountCreate extends OpenAPIRoute {
	schema = {
		tags: ["Accounts"],
		summary: "Create a new account",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: Account.omit({ id: true, created_at: true, user_id: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created account",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							account: Account,
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const acc = data.body;
		const userId = c.get("userId");

		try {
			const result = await c.env.DB.prepare(
				`INSERT INTO accounts (name, type, balance, user_id) VALUES (?, ?, ?, ?) RETURNING *`
			)
				.bind(acc.name, acc.type, acc.balance ?? 0, userId)
				.first();

			return { success: true, account: result };
		} catch (error: any) {
			if (error.message.includes("UNIQUE constraint failed")) {
				return Response.json({ success: false, error: "Account with this name already exists" }, { status: 409 });
			}
			throw error;
		}
	}
}