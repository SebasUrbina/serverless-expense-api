import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class CategoryDelete extends OpenAPIRoute {
	schema = {
		tags: ["Categories"],
		summary: "Delete a Category",
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
				description: "Category not found",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;
		const userId = c.get("userId");

		const result = await c.env.DB.prepare(
			`DELETE FROM categories WHERE id = ? AND user_id = ?`
		)
			.bind(id, userId)
			.run();

		if (result.meta.changes === 0) {
			return Response.json({ success: false, error: "Not found" }, { status: 404 });
		}

		return { success: true };
	}
}