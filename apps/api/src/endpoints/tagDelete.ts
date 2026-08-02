import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class TagDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Delete a Tag",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				id: Num(),
			}),
		},
		responses: {
			"200": {
				description: "Returns success status",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
						}),
					},
				},
			},
			"404": {
				description: "Tag not found",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;
		const userId = c.get("userId");

		const result = await c.env.DB.prepare(
			`DELETE FROM tags WHERE id = ? AND user_id = ?`
		)
			.bind(id, userId)
			.run();

		if (result.meta.changes === 0) {
			return Response.json({ success: false, error: "Not found" }, { status: 404 });
		}

		return { success: true };
	}
}