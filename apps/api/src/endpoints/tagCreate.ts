import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Tag } from "../types";

export class TagCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Create a new tag",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: Tag.omit({ id: true, created_at: true, user_id: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created tag",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							tag: Tag,
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const t = data.body;
		const userId = c.get("userId");

		try {
			const result = await c.env.DB.prepare(
				`INSERT INTO tags (name, user_id) VALUES (?, ?) RETURNING *`
			)
				.bind(t.name, userId)
				.first();

			return { success: true, tag: result };
		} catch (error: any) {
			if (error.message.includes("UNIQUE constraint failed")) {
				return Response.json({ success: false, error: "Tag already exists" }, { status: 409 });
			}
			throw error;
		}
	}
}