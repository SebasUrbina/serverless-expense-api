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
				a.name as account,
				(SELECT json_group_array(tag_id) FROM recurring_rule_tags WHERE recurring_rule_id = r.id) as tag_ids
			FROM recurring_rules r
			LEFT JOIN categories c ON r.category_id = c.id
			LEFT JOIN accounts a ON r.account_id = a.id
			WHERE r.user_id = ? ORDER BY r.created_at DESC
		`).bind(userId).all();

		const rules = result.results.map((r: any) => ({
			...r,
			tag_ids: JSON.parse(r.tag_ids || "[]")
		}));

		return { success: true, rules };
	}
}
