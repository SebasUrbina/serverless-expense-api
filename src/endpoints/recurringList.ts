import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, RecurringRule } from "../types";

export class RecurringList extends OpenAPIRoute {
	schema = {
		tags: ["Recurring"],
		summary: "List all recurring rules",
		security: [{ BearerAuth: [] }],
		responses: {
			"200": {
				description: "Returns all recurring rules for the user",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							rules: RecurringRule.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");
		const result = await c.env.DB.prepare(
			`SELECT * FROM recurring_rules WHERE user_id = ? ORDER BY created_at DESC`
		).bind(userId).all();

		return { success: true, rules: result.results };
	}
}
