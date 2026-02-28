import { DateTime, Num, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{
	Bindings: Env & {
		API_KEY: string;
	};
	Variables: {
		userId: string;
	};
}>;

export const Transaction = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	title: Str({ example: "Groceries" }),
	amount: Num({ example: 45.99 }),
	category: Str({ example: "Food" }),
	type: z.enum(["expense", "income"]).openapi({ example: "expense" }),
	account: Str({ example: "Main Checking" }),
	tag: Str({ required: false, example: "supermarket" }),
	date: Str({ example: "2025-02-24", description: "YYYY-MM-DD" }),
	created_at: DateTime({ required: false }),
});
