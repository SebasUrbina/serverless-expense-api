import { nextOccurrence } from './services/monthlyAvailability';

type DueRule = {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  type: string;
  account_id: number;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  next_run: string;
  end_date: string | null;
  tag_ids: string | null;
};

// Upper bound on catch-up occurrences per rule (e.g. a daily rule paused for a year).
const MAX_OCCURRENCES_PER_RUN = 366;

function buildRuleStatements(db: D1Database, rule: DueRule, today: string) {
  const statements: D1PreparedStatement[] = [];
  const tagIds = rule.tag_ids ?? '[]';
  const hasTags = tagIds !== '[]';
  let runDate = rule.next_run;
  let generated = 0;

  while (
    runDate <= today &&
    (!rule.end_date || runDate <= rule.end_date) &&
    generated < MAX_OCCURRENCES_PER_RUN
  ) {
    statements.push(
      db
        .prepare(
          `INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, recurring_rule_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          rule.title,
          rule.amount,
          rule.category_id,
          rule.type,
          rule.account_id,
          rule.user_id,
          runDate,
          rule.id,
        ),
    );
    if (hasTags) {
      // D1 runs a batch as a single serialized transaction, so MAX(id) is the row inserted just before.
      statements.push(
        db
          .prepare(
            `INSERT INTO transaction_tags (transaction_id, tag_id)
             SELECT (SELECT MAX(id) FROM transactions), value FROM json_each(?)`,
          )
          .bind(tagIds),
      );
    }
    runDate = nextOccurrence(rule, runDate);
    generated++;
  }

  const finished = !!rule.end_date && runDate > rule.end_date;
  statements.push(
    db
      .prepare(
        `UPDATE recurring_rules SET next_run = ?, is_active = CASE WHEN ? THEN 0 ELSE is_active END WHERE id = ?`,
      )
      .bind(runDate, finished ? 1 : 0, rule.id),
  );

  return { statements, generated };
}

// ── Cron handler — called by Cloudflare Cron Trigger ─────────────────────────
export async function scheduled(
  _event: ScheduledEvent,
  env: Env,
) {
  const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD UTC

  const { results: rules } = await env.DB.prepare(
    `SELECT r.*,
            (SELECT json_group_array(tag_id) FROM recurring_rule_tags WHERE recurring_rule_id = r.id) AS tag_ids
     FROM recurring_rules r
     WHERE r.is_active = 1 AND r.next_run <= ?`,
  )
    .bind(today)
    .all<DueRule>();

  let total = 0;
  for (const rule of rules) {
    const { statements, generated } = buildRuleStatements(env.DB, rule, today);
    try {
      await env.DB.batch(statements);
      total += generated;
    } catch (error) {
      console.error(
        `[cron] Failed to process recurring rule ${rule.id}`,
        error,
      );
    }
  }

  console.log(
    `[cron] Generated ${total} recurring transactions from ${rules.length} rules for ${today}`,
  );
}
