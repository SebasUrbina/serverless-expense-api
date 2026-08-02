import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class GroupList extends OpenAPIRoute {
	schema = {
		tags: ["Groups"],
		summary: "List shared groups the user belongs to",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		responses: {
			"200": {
				description: "Returns a list of groups with their members",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							groups: z.array(z.object({
								id: z.number(),
								name: z.string(),
								invite_code: z.string().nullable(),
								created_by: z.string(),
								members: z.array(z.object({
									user_id: z.string(),
									nickname: z.string(),
								})),
							})),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get("userId");

		// Get all groups where user is a member
		const groupsResult = await c.env.DB.prepare(`
			SELECT g.* FROM shared_groups g
			INNER JOIN shared_group_members m ON g.id = m.group_id
			WHERE m.user_id = ?
			ORDER BY g.created_at DESC
		`)
			.bind(userId)
			.all();

		const groups = [];
		for (const group of groupsResult.results) {
			// Get members for each group
			const membersResult = await c.env.DB.prepare(
				`SELECT user_id, nickname FROM shared_group_members WHERE group_id = ?`
			)
				.bind(group.id)
				.all();

			groups.push({
				id: group.id,
				name: group.name,
				invite_code: group.created_by === userId ? group.invite_code : null, // Only creator sees the code
				created_by: group.created_by,
				members: membersResult.results.map((m: any) => ({
					user_id: m.user_id,
					nickname: m.nickname,
				})),
			});
		}

		return {
			success: true,
			groups,
		};
	}
}
