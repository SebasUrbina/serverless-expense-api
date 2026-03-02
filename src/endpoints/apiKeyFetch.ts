import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ApiKeyFetch extends OpenAPIRoute {
	schema = {
		tags: ["API Keys"],
		summary: "Fetch User API Key",
		security: [{ BearerAuth: [] }],
		responses: {
			"200": {
				description: "Returns the user's static API key if it exists",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									key: Str().nullable(),
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

		const result = await c.env.DB.prepare(
			`SELECT key FROM api_keys WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
		)
			.bind(userId)
			.first<{ key: string }>();

		return {
			success: true,
			key: result ? result.key : null,
		};
	}
}
