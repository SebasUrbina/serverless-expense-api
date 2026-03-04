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
		// Centralized configuration block
		const config = {
			iosShortcutUrl: "https://www.icloud.com/shortcuts/a066d55051cd4144b17edf9a6d5a554e",
		};

		return c.json(config);
	}
}
