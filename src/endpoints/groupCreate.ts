import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class GroupCreate extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "Create a shared group and generate an invite code",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: Str({ example: "Pareja" }),
							nickname: Str({ required: false, description: "Optional display name override" }),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created group with invite code",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							group: z.object({
								id: z.number(),
								name: z.string(),
								invite_code: z.string(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name, nickname } = data.body;
		const userId = c.get("userId");
		const displayName = nickname || c.get("userDisplayName");

		// Generate 6-char invite code
		const inviteCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
			.map(b => b.toString(36).padStart(2, "0"))
			.join("")
			.slice(0, 6)
			.toUpperCase();

		// Create group
		const group = await c.env.DB.prepare(
			`INSERT INTO shared_groups (name, created_by, invite_code) VALUES (?, ?, ?) RETURNING *`
		)
			.bind(name, userId, inviteCode)
			.first() as any;

		// Add creator as first member
		await c.env.DB.prepare(
			`INSERT INTO shared_group_members (group_id, user_id, nickname) VALUES (?, ?, ?)`
		)
			.bind(group.id, userId, displayName)
			.run();

		return {
			success: true,
			group: {
				id: group.id,
				name: group.name,
				invite_code: group.invite_code,
			},
		};
	}
}
