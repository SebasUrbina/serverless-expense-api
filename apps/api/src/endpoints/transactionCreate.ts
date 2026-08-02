import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Transaction } from "../types";

function addMonths(baseDate: string, count: number): string {
	const [yearStr, monthStr, dayStr] = baseDate.split("-");
	if (!yearStr || !monthStr || !dayStr) return baseDate;
	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);
	let dYear = year;
	let dMonth = month - 1 + count;
	dYear += Math.floor(dMonth / 12);
	dMonth = dMonth % 12;

	const maxDays = new Date(dYear, dMonth + 1, 0).getDate();
	const dDay = Math.min(day, maxDays);

	const finalDate = new Date(dYear, dMonth, dDay);
	const yyyy = finalDate.getFullYear();
	const mm = String(finalDate.getMonth() + 1).padStart(2, "0");
	const dd = String(finalDate.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

export class TransactionCreate extends OpenAPIRoute {
	schema = {
		tags: ["Transactions"],
		summary: "Create a new Transaction",
		security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
		request: {
			body: {
				content: {
					"application/json": {
						schema: Transaction.omit({ id: true, created_at: true }),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created transaction",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									transaction: Transaction,
								}),
							}),
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

		const isShared = t.is_shared ? 1 : 0;
		const groupId = t.group_id || null;

		// Validate group membership if shared
		if (isShared && groupId) {
			const membership = await c.env.DB.prepare(
				`SELECT * FROM shared_group_members WHERE group_id = ? AND user_id = ?`
			).bind(groupId, userId).first();
			if (!membership) {
				return c.json({ success: false, error: "You are not a member of this group" }, 403);
			}
		}

		const installmentsCount = t.installments || 1;

		if (installmentsCount > 1) {
			const baseAmount = Math.floor(t.amount / installmentsCount);
			let totalDistributed = 0;
			const installmentAmounts: number[] = [];

			for (let i = 0; i < installmentsCount; i++) {
				installmentAmounts.push(baseAmount);
				totalDistributed += baseAmount;
			}

			const remainder = t.amount - totalDistributed;
			if (remainder !== 0) {
				installmentAmounts[0] = installmentAmounts[0]! + remainder;
			}

			const createdTransactions: any[] = [];

			for (let idx = 0; idx < installmentsCount; idx++) {
				const instAmt = installmentAmounts[idx]!;
				const instDate = addMonths(t.date, idx);
				const instTitle = `${t.title} (Cuota ${idx + 1}/${installmentsCount})`;

				// 1. Insert Transaction
				const txResult = await c.env.DB.prepare(
					`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
				)
					.bind(instTitle, instAmt, t.category_id, t.type, t.account_id, userId, instDate, isShared, groupId)
					.first() as any;

				// 2 & 3. Insert Tags and Splits in a single combined D1 batch call
				const batchStmts: any[] = [];
				if (t.tag_ids && t.tag_ids.length > 0) {
					t.tag_ids.forEach(tagId => {
						batchStmts.push(
							c.env.DB.prepare(`INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`).bind(txResult.id, tagId)
						);
					});
				}
				if (isShared && t.splits && t.splits.length > 0) {
					t.splits.forEach(split => {
						const splitAmount = Math.round((instAmt * split.percentage) / 100);
						batchStmts.push(
							c.env.DB.prepare(
								`INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`
							).bind(txResult.id, split.user_id, splitAmount, split.percentage)
						);
					});
				}
				if (batchStmts.length > 0) {
					await c.env.DB.batch(batchStmts);
				}

				let finalSplits: any[] = [];
				if (isShared && t.splits && t.splits.length > 0) {
					// Fetch splits with nicknames for response
					const splitsResult = await c.env.DB.prepare(`
						SELECT ts.*, sgm.nickname
						FROM transaction_splits ts
						LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
						WHERE ts.transaction_id = ?
					`).bind(groupId, txResult.id).all();
					finalSplits = splitsResult.results;
				}

				const finalResult = { ...txResult, tag_ids: t.tag_ids || [], splits: finalSplits };
				createdTransactions.push(finalResult);
			}

			return {
				success: true,
				transaction: createdTransactions[0],
			};
		} else {
			// 1. Insert Transaction
			const txResult = await c.env.DB.prepare(
				`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
			)
				.bind(t.title, t.amount, t.category_id, t.type, t.account_id, userId, t.date, isShared, groupId)
				.first() as any;

			// 2 & 3. Insert Tags and Splits in a single combined D1 batch call
			const batchStmts: any[] = [];
			if (t.tag_ids && t.tag_ids.length > 0) {
				t.tag_ids.forEach(tagId => {
					batchStmts.push(
						c.env.DB.prepare(`INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`).bind(txResult.id, tagId)
					);
				});
			}
			if (isShared && t.splits && t.splits.length > 0) {
				t.splits.forEach(split => {
					const splitAmount = Math.round((t.amount * split.percentage) / 100);
					batchStmts.push(
						c.env.DB.prepare(
							`INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`
						).bind(txResult.id, split.user_id, splitAmount, split.percentage)
					);
				});
			}
			if (batchStmts.length > 0) {
				await c.env.DB.batch(batchStmts);
			}

			let finalSplits: any[] = [];
			if (isShared && t.splits && t.splits.length > 0) {
				// Fetch splits with nicknames for response
				const splitsResult = await c.env.DB.prepare(`
					SELECT ts.*, sgm.nickname
					FROM transaction_splits ts
					LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
					WHERE ts.transaction_id = ?
				`).bind(groupId, txResult.id).all();
				finalSplits = splitsResult.results;
			}

			// Merge for frontend
			const finalResult = { ...txResult, tag_ids: t.tag_ids || [], splits: finalSplits };

			return {
				success: true,
				transaction: finalResult,
			};
		}
	}
}
