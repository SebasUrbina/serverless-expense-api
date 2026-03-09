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
		`SELECT r.*, 
		    (SELECT json_group_array(tag_id) FROM recurring_rule_tags WHERE recurring_rule_id = r.id) as tag_ids
		 FROM recurring_rules r 
		 WHERE r.is_active = 1 AND r.next_run <= ?`
	).bind(today).all();

	if (rules.length === 0) return;

	const stmts: any[] = [];

	for (const rule of rules as any[]) {
		const nextRun = computeNextRun(rule.frequency, rule.day_of_month, rule.next_run);
		const tagIds = JSON.parse(rule.tag_ids || "[]") as number[];

		// 1. Prepare Transaction Insert
		const txId = crypto.randomUUID(); // We need an ID to link tags if we want to do it all in one batch with specific IDs, 
		// but SQLite AUTOINCREMENT is tricky in batch if we need the ID for the next stmt in the SAME batch.
		// However, I can use a subquery for the ID or just do it in separate steps.
		// BETTER: Use a CTE or just two batches? No, D1 batch is meant for independent stmts or we can use `last_insert_rowid()`.
		// But in a batch of MANY transactions, `last_insert_rowid()` is dangerous.
		
		// Actually, I can just use a separate batch for each rule or just accept that I can't easily link tags in ONE global batch without knowing IDs.
		// OR: I can insert the transaction, then in a separate tool/step insert tags.
		
		// Wait, if I'm in a worker, I can just await the tx insert, get the ID, then batch the tags.
		// But the current code tries to be efficient with one batch.
		
		// Let's do it per rule to be safe with IDs, or use a custom ID (UUID) if I change the schema to use TEXT IDs (not requested).
		// Alternative: Use `RETURNING id` and await each.
		
		const txResult = await env.DB.prepare(
			`INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, recurring_rule_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
		).bind(
			rule.title, rule.amount, rule.category_id, rule.type,
			rule.account_id, rule.user_id, rule.next_run, rule.id
		).first() as any;

		if (txResult && tagIds.length > 0) {
			const tagStmts = tagIds.map(tId => 
				env.DB.prepare(`INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`).bind(txResult.id, tId)
			);
			stmts.push(...tagStmts);
		}

		// 2. Advance next_run
		stmts.push(
			env.DB.prepare(`UPDATE recurring_rules SET next_run = ? WHERE id = ?`).bind(nextRun, rule.id)
		);
	}

	// Run remaining updates + tag inserts
	if (stmts.length > 0) {
		await env.DB.batch(stmts);
	}

	console.log(`[cron] Generated ${rules.length} recurring transactions for ${today}`);
}
