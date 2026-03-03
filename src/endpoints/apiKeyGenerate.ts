import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ApiKeyGenerate extends OpenAPIRoute {
	schema = {
		tags: ["API Keys"],
		summary: "Generate a new User API Key",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Creates and returns a new static API key for the user (revokes previous)",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									key: Str(),
								}),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");

		// Delete any existing keys for this user to ensure only 1 active key
		await c.env.DB.prepare(`DELETE FROM api_keys WHERE user_id = ?`).bind(userId).run();

		// Generate a shorter token (e.g. ek_live_1234abcd)
		const randomString = crypto.randomUUID().split("-")[0];
		const newKey = `sk-${randomString}`; // Expense Key Live

		// Store in database
		await c.env.DB.prepare(`INSERT INTO api_keys (key, user_id) VALUES (?, ?)`)
			.bind(newKey, userId)
			.run();

		return {
			success: true,
			key: newKey,
		};
	}
}
