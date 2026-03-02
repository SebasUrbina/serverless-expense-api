import { DateTime, Num, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{
	Bindings: Env & {
		API_KEY: string;
		SUPABASE_URL: string;
		SUPABASE_ANON_KEY: string;
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
	recurring_rule_id: Num({ required: false, description: "Origin recurring rule ID" }),
	created_at: DateTime({ required: false }),
});

export const RecurringRule = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	title: Str({ example: "Netflix" }),
	amount: Num({ example: 15.99 }),
	category: Str({ example: "Entertainment" }),
	type: z.enum(["expense", "income"]).openapi({ example: "expense" }),
	account: Str({ example: "Credit Card" }),
	tag: Str({ required: false, example: "subscription" }),
	frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).openapi({ example: "monthly" }),
	day_of_month: Num({ required: false, description: "Day 1-28 for monthly frequency" }),
	next_run: Str({ example: "2025-03-05", description: "YYYY-MM-DD" }),
	is_active: Num({ required: false, description: "1 = active, 0 = paused" }),
	created_at: DateTime({ required: false }),
});
