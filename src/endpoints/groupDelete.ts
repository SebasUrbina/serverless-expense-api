import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class GroupDelete extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "Delete a shared group (creator only)",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				id: Num({ description: "Group ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Group deleted successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							message: z.string(),
						}),
					},
				},
			},
			"404": {
				description: "Group not found or not authorized",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							error: z.string(),
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

		// Check if group exists and user is the creator
		const group = await c.env.DB.prepare(
			`SELECT * FROM shared_groups WHERE id = ? AND created_by = ?`
		)
			.bind(id, userId)
			.first();

		if (!group) {
			return c.json({ success: false, error: "Group not found or you are not the creator" }, 404);
		}

		// Delete group (CASCADE will remove members)
		await c.env.DB.prepare(`DELETE FROM shared_groups WHERE id = ?`)
			.bind(id)
			.run();

		return {
			success: true,
			message: "Group deleted successfully",
		};
	}
}
