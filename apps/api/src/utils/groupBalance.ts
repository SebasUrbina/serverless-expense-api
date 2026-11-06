import { todayLocal } from './date';

type BalanceRow = {
  user_id: string;
  nickname: string;
  total_paid: number;
  total_share: number;
  total_sent: number;
  total_received: number;
  month_paid: number;
  month_share: number;
  transaction_count: number;
  settlement_count: number;
};

/**
 * Every member's accumulated balance up to `asOf`, with the totals of the month
 * from `monthStart` to `monthLast`. The group's shared movements up to `asOf`
 * are scanned once and reused for both.
 *
 * CROSS JOIN keeps tx as the outer loop, so splits are looked up per movement
 * by transaction_id; otherwise SQLite walks every split in the database.
 */
export function groupBalanceStatement(
  db: D1Database,
  groupId: number,
  asOf: string,
  monthStart = asOf,
  monthLast = asOf,
) {
  return db
    .prepare(
      `
			WITH tx AS MATERIALIZED (
				SELECT id, user_id, amount, date FROM transactions
				WHERE group_id = ?1 AND is_shared = 1 AND type = 'expense' AND date <= ?2
			), shares AS MATERIALIZED (
				SELECT s.user_id,
					SUM(s.amount) AS total,
					SUM(CASE WHEN tx.date >= ?3 AND tx.date <= ?4 THEN s.amount ELSE 0 END) AS month_total
				FROM tx CROSS JOIN transaction_splits s ON s.transaction_id = tx.id
				GROUP BY s.user_id
			), paid AS MATERIALIZED (
				SELECT user_id,
					SUM(amount) AS total,
					SUM(CASE WHEN date >= ?3 AND date <= ?4 THEN amount ELSE 0 END) AS month_total
				FROM tx GROUP BY user_id
			), payments AS MATERIALIZED (
				SELECT from_user_id, to_user_id, amount, date FROM group_settlements
				WHERE group_id = ?1 AND date <= ?2
			), sent AS (
				SELECT from_user_id AS user_id, SUM(amount) AS total FROM payments GROUP BY from_user_id
			), received AS (
				SELECT to_user_id AS user_id, SUM(amount) AS total FROM payments GROUP BY to_user_id
			)
			SELECT
				m.user_id,
				m.nickname,
				COALESCE(paid.total, 0) AS total_paid,
				COALESCE(shares.total, 0) AS total_share,
				COALESCE(sent.total, 0) AS total_sent,
				COALESCE(received.total, 0) AS total_received,
				COALESCE(paid.month_total, 0) AS month_paid,
				COALESCE(shares.month_total, 0) AS month_share,
				(SELECT COUNT(*) FROM tx WHERE date >= ?3 AND date <= ?4) AS transaction_count,
				(SELECT COUNT(*) FROM payments WHERE date >= ?3 AND date <= ?4) AS settlement_count
			FROM shared_group_members m
			LEFT JOIN paid ON paid.user_id = m.user_id
			LEFT JOIN shares ON shares.user_id = m.user_id
			LEFT JOIN sent ON sent.user_id = m.user_id
			LEFT JOIN received ON received.user_id = m.user_id
			WHERE m.group_id = ?1
		`,
    )
    .bind(groupId, asOf, monthStart, monthLast);
}

export function membersFromRows(rows: unknown[]) {
  return (rows as BalanceRow[]).map((m) => ({
    user_id: m.user_id,
    nickname: m.nickname,
    total_paid: m.total_paid,
    total_share: m.total_share,
    // Paying someone raises your balance; being paid lowers it.
    net: m.total_paid - m.total_share + m.total_sent - m.total_received,
    month_paid: m.month_paid,
    month_share: m.month_share,
  }));
}

/** Members' accumulated balances up to today. */
export async function groupNets(db: D1Database, groupId: number) {
  const { results } = await groupBalanceStatement(
    db,
    groupId,
    todayLocal(),
  ).all();
  return membersFromRows(results);
}

/** Whether a balance counts as owing or being owed (under one peso doesn't). */
export const hasDebt = (net: number) => Math.abs(net) >= 1;

/**
 * Removes a group. Its movements stay as personal movements of whoever paid
 * them, without parts; members and payments go with the group.
 */
export const deleteGroupStatements = (db: D1Database, groupId: number) => [
  db
    .prepare(
      `DELETE FROM transaction_splits
       WHERE transaction_id IN (SELECT id FROM transactions WHERE group_id = ?)`,
    )
    .bind(groupId),
  db
    .prepare(
      `UPDATE transactions SET is_shared = 0, group_id = NULL WHERE group_id = ?`,
    )
    .bind(groupId),
  db.prepare(`DELETE FROM shared_groups WHERE id = ?`).bind(groupId),
];
