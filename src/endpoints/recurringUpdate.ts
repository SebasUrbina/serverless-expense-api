import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, RecurringRule } from "../types";

export class RecurringUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Recurring"],
		summary: "Update a recurring rule",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({ id: Num({ description: "Rule ID" }) }),
			body: {
				content: {
					"application/json": {
						schema: RecurringRule.omit({ id: true, created_at: true }).partial(),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the updated rule",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), rule: RecurringRule }),
					},
				},
			},
			"404": {
				description: "Rule not found",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), error: z.string() }),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;
		const updates = data.body;
		const userId = c.get("userId");

		const existing = await c.env.DB.prepare(
			`SELECT * FROM recurring_rules WHERE id = ? AND user_id = ?`
		).bind(id, userId).first();
		if (!existing) return c.json({ success: false, error: "Rule not found" }, 404);

		const merged = {
			title:         updates.title             ?? existing.title,
			amount:        updates.amount            ?? existing.amount,
			category_id:   updates.category_id       ?? existing.category_id,
			type:          updates.type              ?? existing.type,
			account_id:    updates.account_id        ?? existing.account_id,
			tag_id:        updates.tag_id            ?? existing.tag_id,
			frequency:     updates.frequency         ?? existing.frequency,
			day_of_month:  updates.day_of_month      ?? existing.day_of_month,
			next_run:      updates.next_run          ?? existing.next_run,
			is_active:     updates.is_active         ?? existing.is_active,
		};

		const result = await c.env.DB.prepare(
			`UPDATE recurring_rules
			 SET title=?, amount=?, category_id=?, type=?, account_id=?, tag_id=?,
			     frequency=?, day_of_month=?, next_run=?, is_active=?
			 WHERE id=? AND user_id=? RETURNING *`
		).bind(
			merged.title, merged.amount, merged.category_id, merged.type,
			merged.account_id, merged.tag_id, merged.frequency, merged.day_of_month,
			merged.next_run, merged.is_active, id, userId
		).first();

		return { success: true, rule: result };
	}
}
