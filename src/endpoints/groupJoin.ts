import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class GroupJoin extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "Join a shared group using an invite code",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							invite_code: Str({ example: "ABC123" }),
							nickname: Str({ required: false, description: "Optional display name override" }),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Successfully joined the group",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							group: z.object({
								id: z.number(),
								name: z.string(),
							}),
						}),
					},
				},
			},
			"404": {
				description: "Invite code not found",
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
		const { invite_code, nickname } = data.body;
		const userId = c.get("userId");
		const displayName = nickname || c.get("userDisplayName");

		// Find group by invite code
		const group = await c.env.DB.prepare(
			`SELECT * FROM shared_groups WHERE invite_code = ?`
		)
			.bind(invite_code.toUpperCase())
			.first() as any;

		if (!group) {
			return c.json({ success: false, error: "Invalid invite code" }, 404);
		}

		// Check if already a member
		const existing = await c.env.DB.prepare(
			`SELECT * FROM shared_group_members WHERE group_id = ? AND user_id = ?`
		)
			.bind(group.id, userId)
			.first();

		if (existing) {
			return c.json({ success: false, error: "You are already a member of this group" }, 400);
		}

		// Add as member
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
			},
		};
	}
}
