import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, RecurringRule } from "../types";

export class RecurringCreate extends OpenAPIRoute {
	schema = {
		tags: ["Recurring"],
		summary: "Create a recurring rule",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: RecurringRule.omit({ id: true, created_at: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created rule",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							rule: RecurringRule,
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const r = data.body;
		const userId = c.get("userId");

		const txResult = await c.env.DB.prepare(
			`INSERT INTO recurring_rules
			 (user_id, title, amount, category_id, type, account_id, frequency, day_of_month, next_run, is_active)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1) RETURNING *`
		)
			.bind(userId, r.title, r.amount, r.category_id, r.type, r.account_id,
				r.frequency, r.day_of_month ?? null, r.next_run)
			.first() as any;

		if (r.tag_ids && r.tag_ids.length > 0) {
			const tagStmts = r.tag_ids.map(tagId =>
				c.env.DB.prepare(`INSERT INTO recurring_rule_tags (recurring_rule_id, tag_id) VALUES (?, ?)`).bind(txResult.id, tagId)
			);
			await c.env.DB.batch(tagStmts);
		}

		return { success: true, rule: { ...txResult, tag_ids: r.tag_ids || [] } };
	}
}
