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
		userDisplayName: string;
	};
}>;

export const Transaction = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	title: Str({ example: "Groceries" }),
	amount: Num({ example: 45.99 }),
	category_id: Num({ example: 1 }),
	type: z.enum(["expense", "income"]).openapi({ example: "expense" }),
	account_id: Num({ example: 12 }),
	tag_ids: z.array(Num()).optional(),
	date: Str({ example: "2025-02-24", description: "YYYY-MM-DD" }),
	recurring_rule_id: Num({ required: false, description: "Origin recurring rule ID" }),
	is_shared: Num({ required: false, description: "1 = shared, 0 = personal" }),
	group_id: Num({ required: false, description: "Shared group ID" }),
	splits: z.array(z.object({
		user_id: Str(),
		percentage: Num(),
		amount: Num({ required: false }),
		nickname: Str({ required: false }),
	})).optional(),
	created_at: DateTime({ required: false }),
});

export const RecurringRule = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	title: Str({ example: "Netflix" }),
	amount: Num({ example: 15.99 }),
	category_id: Num({ example: 2 }),
	type: z.enum(["expense", "income"]).openapi({ example: "expense" }),
	account_id: Num({ example: 14 }),
	tag_ids: z.array(Num()).optional(),
	frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).openapi({ example: "monthly" }),
	day_of_month: Num({ required: false, description: "Day 1-28 for monthly frequency" }),
	next_run: Str({ example: "2025-03-05", description: "YYYY-MM-DD" }),
	is_active: Num({ required: false, description: "1 = active, 0 = paused" }),
	created_at: DateTime({ required: false }),
});

export const Category = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	name: Str({ example: "Food" }),
	type: z.enum(["expense", "income"]).openapi({ example: "expense" }),
	icon: Str({ required: false, example: "coffee" }),
	user_id: Str({ required: false }),
	created_at: DateTime({ required: false }),
});

export const Tag = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	name: Str({ example: "vacation" }),
	user_id: Str({ required: false }),
	created_at: DateTime({ required: false }),
});

export const Account = z.object({
	id: Num({ required: false, description: "Auto-generated ID" }),
	name: Str({ example: "Banco de Chile" }),
	type: z.enum(["checking", "savings", "credit", "cash"]).openapi({ example: "checking" }),
	balance: Num({ required: false, example: 1500000 }),
	user_id: Str({ required: false }),
	created_at: DateTime({ required: false }),
});
