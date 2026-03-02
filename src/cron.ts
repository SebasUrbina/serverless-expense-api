// ── next_run computation ──────────────────────────────────────────────────────
function computeNextRun(frequency: string, dayOfMonth: number | null, fromDate: string): string {
	const [year, month, day] = fromDate.split("-").map(Number);
	const d = new Date(year, month - 1, day);

	switch (frequency) {
		case "daily":
			d.setDate(d.getDate() + 1);
			break;
		case "weekly":
			d.setDate(d.getDate() + 7);
			break;
		case "monthly": {
			// Move to the same day_of_month next month, clamped to 28
			const targetDay = Math.min(dayOfMonth ?? day, 28);
			d.setMonth(d.getMonth() + 1);
			d.setDate(targetDay);
			break;
		}
		case "yearly":
			d.setFullYear(d.getFullYear() + 1);
			break;
	}

	const yyyy = d.getFullYear();
	const mm   = String(d.getMonth() + 1).padStart(2, "0");
	const dd   = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

// ── Cron handler — called by Cloudflare Cron Trigger ─────────────────────────
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC

	// Find all active rules due today or overdue
	const { results: rules } = await env.DB.prepare(
		`SELECT * FROM recurring_rules WHERE is_active = 1 AND next_run <= ?`
	).bind(today).all();

	if (rules.length === 0) return;

	const stmts = rules.flatMap((rule: any) => {
		const nextRun = computeNextRun(rule.frequency, rule.day_of_month, rule.next_run);

		return [
			// 1. Insert the transaction
			env.DB.prepare(
				`INSERT INTO transactions
				 (title, amount, category, type, account, user_id, tag, date, recurring_rule_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			).bind(
				rule.title, rule.amount, rule.category, rule.type,
				rule.account, rule.user_id, rule.tag ?? null, rule.next_run, rule.id
			),
			// 2. Advance next_run
			env.DB.prepare(
				`UPDATE recurring_rules SET next_run = ? WHERE id = ?`
			).bind(nextRun, rule.id),
		];
	});

	// Run all inserts + updates atomically in one batch
	await env.DB.batch(stmts);

	console.log(`[cron] Generated ${rules.length} recurring transactions for ${today}`);
}
