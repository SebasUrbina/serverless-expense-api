import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Category } from "../types";

export class CategoryCreate extends OpenAPIRoute {
	schema = {
		tags: ["Categories"],
		summary: "Create a new category",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: Category.omit({ id: true, created_at: true, user_id: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created category",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							category: Category,
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const cat = data.body;
		const userId = c.get("userId");

		try {
			const result = await c.env.DB.prepare(
				`INSERT INTO categories (name, type, icon, user_id) VALUES (?, ?, ?, ?) RETURNING *`
			)
				.bind(cat.name, cat.type, cat.icon ?? null, userId)
				.first();

			return { success: true, category: result };
		} catch (error: any) {
			if (error.message.includes("UNIQUE constraint failed")) {
				return Response.json({ success: false, error: "Category already exists for this type" }, { status: 409 });
			}
			throw error;
		}
	}
}