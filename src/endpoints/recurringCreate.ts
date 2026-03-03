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

		const result = await c.env.DB.prepare(
			`INSERT INTO recurring_rules
			 (user_id, title, amount, category, type, account, tag, frequency, day_of_month, next_run, is_active)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) RETURNING *`
		)
			.bind(userId, r.title, r.amount, r.category, r.type, r.account,
				r.tag ?? null, r.frequency, r.day_of_month ?? null, r.next_run)
			.first();

		return { success: true, rule: result };
	}
}
