import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Category } from "../types";

export class CategoryUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Categories"],
		summary: "Update a Category",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			params: z.object({
				id: Num(),
			}),
			body: {
				content: {
					"application/json": {
						schema: Category.partial().omit({ id: true, created_at: true, user_id: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the updated category",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							category: Category,
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
		const updates = data.body;
		const userId = c.get("userId");

		if (Object.keys(updates).length === 0) {
			return Response.json({ success: false, error: "No fields to update" }, { status: 400 });
		}

		const setClauses: string[] = [];
		const values: any[] = [];

		for (const [key, val] of Object.entries(updates)) {
			setClauses.push(`${key} = ?`);
			values.push(val);
		}

		values.push(id, userId);

		try {
			const result = await c.env.DB.prepare(
				`UPDATE categories SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`
			).bind(...values).first();

			if (!result) {
				return Response.json({ success: false, error: "Not found" }, { status: 404 });
			}

			return { success: true, category: result };
		} catch (error: any) {
			if (error.message.includes("UNIQUE constraint failed")) {
				return Response.json({ success: false, error: "Category already exists for this type" }, { status: 409 });
			}
			throw error;
		}
	}
}