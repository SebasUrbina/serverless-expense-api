import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Tag } from "../types";

export class TagList extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "List all tags",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Returns a list of tags",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							tags: z.array(Tag),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");

		const { results } = await c.env.DB.prepare(
			`SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC`
		).bind(userId).all();

		return {
			success: true,
			tags: results,
		};
	}
}