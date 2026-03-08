import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, RecurringRule } from "../types";

export class RecurringList extends OpenAPIRoute {
	schema = {
		tags: ["Recurring"],
		summary: "List all recurring rules",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
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
		const result = await c.env.DB.prepare(`
			SELECT 
				r.*, 
				c.name as category,
				c.icon as category_icon,
				tag.name as tag
			FROM recurring_rules r
			LEFT JOIN categories c ON r.category_id = c.id
			LEFT JOIN tags tag ON r.tag_id = tag.id
			WHERE r.user_id = ? ORDER BY r.created_at DESC
		`).bind(userId).all();

		return { success: true, rules: result.results };
	}
}
