import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class GroupUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "Update a group (rename)",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				id: Num({ description: "Group ID" }),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: Str({ description: "New group name" }),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Group updated",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							group: z.any(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;
		const userId = c.get("userId");
		const { name } = data.body;

		// Only the creator (who has invite_code visible) can rename
		const group = await c.env.DB.prepare(
			`SELECT * FROM shared_groups WHERE id = ? AND created_by = ?`
		).bind(id, userId).first();

		if (!group) {
			return c.json({ success: false, error: "Group not found or not the creator" }, 404);
		}

		await c.env.DB.prepare(
			`UPDATE shared_groups SET name = ? WHERE id = ?`
		).bind(name.trim(), id).run();

		return {
			success: true,
			group: { ...group, name: name.trim() },
		};
	}
}
