/** Category that holds a member's share when the payer's category has no match. */
export const SHARED_CATEGORY = { name: 'Compartidos', icon: '👥' } as const;

/** Gives a group member the `Compartidos` category if they don't have it yet. */
export const sharedCategoryInsert = (db: D1Database, userId: string) =>
  db
    .prepare(
      `INSERT OR IGNORE INTO categories (user_id, name, type, icon) VALUES (?, ?, 'expense', ?)`,
    )
    .bind(userId, SHARED_CATEGORY.name, SHARED_CATEGORY.icon);

/**
 * CTE `my_tx(id, title, type, date, recurring_rule_id, category_id, amount)`:
 * what the user consumed between two dates. Own movements count in full,
 * except shared expenses, which count only the user's share; shares of
 * expenses other members paid are added, under the user's category with the
 * payer's category name, or `Compartidos`. Payments recorded by the removed
 * settle endpoint (titled "💸 Saldo…") are left out: they were transfers.
 *
 * Both branches are bounded by date: the first uses (user_id, date) and the
 * second (group_id, date), so rows read grow with the range, not the history.
 * CROSS JOIN pins that order; otherwise SQLite starts from every split of the
 * user, which has no date.
 */
export function myMovementsCte(userId: string, start: string, end: string) {
  return {
    sql: `my_tx AS (
			SELECT t.id, t.title, t.type, t.date, t.recurring_rule_id, t.category_id,
				CASE WHEN t.is_shared = 1 AND t.type = 'expense'
					THEN COALESCE(own.amount, t.amount) ELSE t.amount END AS amount
			FROM transactions t
			LEFT JOIN transaction_splits own
				ON t.is_shared = 1 AND own.transaction_id = t.id AND own.user_id = t.user_id
			WHERE t.user_id = ? AND t.date >= ? AND t.date <= ?
				AND t.title NOT LIKE '💸 Saldo%'
			UNION ALL
			SELECT t.id, t.title, t.type, t.date, NULL, COALESCE(same.id, shared.id), s.amount
			FROM shared_group_members g
			CROSS JOIN transactions t
				ON t.group_id = g.group_id AND t.date >= ? AND t.date <= ?
			CROSS JOIN transaction_splits s
				ON s.transaction_id = t.id AND s.user_id = g.user_id
			LEFT JOIN categories pc ON pc.id = t.category_id
			LEFT JOIN categories same
				ON same.user_id = g.user_id AND same.type = 'expense' AND same.name = pc.name
			LEFT JOIN categories shared
				ON shared.user_id = g.user_id AND shared.type = 'expense' AND shared.name = '${SHARED_CATEGORY.name}'
			WHERE g.user_id = ? AND t.user_id != g.user_id
				AND t.is_shared = 1 AND t.type = 'expense' AND s.amount > 0
				AND t.title NOT LIKE '💸 Saldo%'
		)`,
    binds: [userId, start, end, start, end, userId],
  };
}
