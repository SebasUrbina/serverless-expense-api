import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Category } from "../types";

export class CategoryList extends OpenAPIRoute {
	schema = {
		tags: ["Categories"],
		summary: "List all categories",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Returns a list of categories",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							categories: z.array(Category),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");

		const { results } = await c.env.DB.prepare(
			`SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC`
		).bind(userId).all();

		return {
			success: true,
			categories: results,
		};
	}
}