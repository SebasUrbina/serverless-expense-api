import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class AppConfigFetch extends OpenAPIRoute {
	schema = {
		tags: ["Configuration"],
		summary: "Fetch App Configuration",
		description: "Retrieves centralized application configuration settings like iOS Shortcut URLs.",
		responses: {
			200: {
				description: "Application configuration",
				content: {
					"application/json": {
						schema: z.object({
							iosShortcutUrl: z.string().describe("URL to download the iOS Shortcut"),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const iosShortcutUrl = c.env?.IOS_SHORTCUT_URL;
		return c.json({ iosShortcutUrl });
	}
}
