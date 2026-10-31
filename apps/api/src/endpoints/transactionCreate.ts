import { Bool, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, Transaction } from '../types';

function addMonths(baseDate: string, count: number): string {
  const [yearStr, monthStr, dayStr] = baseDate.split('-');
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
  const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
  const dd = String(finalDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function splitIntoInstallments(amount: number, count: number): number[] {
  const base = Math.floor(amount / count);
  const amounts = Array.from({ length: count }, () => base);
  amounts[0] = amounts[0]! + (amount - base * count);
  return amounts;
}

const SPLIT_TOTAL_TOLERANCE = 0.5;

export class TransactionCreate extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'Create a new Transaction',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: Transaction.omit({
              id: true,
              created_at: true,
              installment_number: true,
              installment_total: true,
            }),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the created transaction',
        content: {
          'application/json': {
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
    const userId = c.get('userId');
    const db = c.env.DB;

    const installmentsCount = t.installments ?? 1;
    if (installmentsCount > 1 && t.type !== 'expense') {
      return c.json(
        {
          success: false,
          error: 'Installments are only supported for expenses',
        },
        400,
      );
    }

    const isShared = t.is_shared ? 1 : 0;
    const groupId = t.group_id || null;
    const splits = isShared ? (t.splits ?? []) : [];
    const tagIds = t.tag_ids ?? [];

    const [ownership, members] = await db.batch<
      { id: number } | { user_id: string }
    >([
      db
        .prepare(
          `SELECT
             (SELECT 1 FROM categories WHERE id = ? AND user_id = ?) AS category_ok,
             (SELECT 1 FROM accounts WHERE id = ? AND user_id = ?) AS account_ok`,
        )
        .bind(t.category_id, userId, t.account_id, userId),
      db
        .prepare(`SELECT user_id FROM shared_group_members WHERE group_id = ?`)
        .bind(groupId),
    ]);

    const owned = ownership.results[0] as unknown as {
      category_ok: number | null;
      account_ok: number | null;
    };
    if (!owned?.category_ok || !owned?.account_ok) {
      return c.json(
        { success: false, error: 'Category or account not found' },
        404,
      );
    }

    if (isShared && groupId) {
      const memberIds = new Set(
        (members.results as { user_id: string }[]).map((m) => m.user_id),
      );
      if (!memberIds.has(userId)) {
        return c.json(
          { success: false, error: 'You are not a member of this group' },
          403,
        );
      }
      if (splits.some((s) => !memberIds.has(s.user_id))) {
        return c.json(
          { success: false, error: 'Split users must be members of the group' },
          400,
        );
      }
    }

    if (splits.length > 0) {
      const total = splits.reduce((sum, s) => sum + s.percentage, 0);
      if (
        splits.some((s) => s.percentage < 0) ||
        Math.abs(total - 100) > SPLIT_TOTAL_TOLERANCE
      ) {
        return c.json(
          { success: false, error: 'Split percentages must add up to 100' },
          400,
        );
      }
    }

    // D1 runs a batch as a single serialized transaction, so MAX(id) is the row inserted just before.
    const lastTransactionId = `(SELECT MAX(id) FROM transactions)`;
    const amounts = splitIntoInstallments(t.amount, installmentsCount);
    const isInstallment = installmentsCount > 1;
    const statements: D1PreparedStatement[] = [];
    const insertIndexes: number[] = [];

    amounts.forEach((amount, idx) => {
      insertIndexes.push(statements.length);
      statements.push(
        db
          .prepare(
            `INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id, installment_number, installment_total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
          )
          .bind(
            t.title,
            amount,
            t.category_id,
            t.type,
            t.account_id,
            userId,
            addMonths(t.date, idx),
            isShared,
            groupId,
            isInstallment ? idx + 1 : null,
            isInstallment ? installmentsCount : null,
          ),
      );

      if (tagIds.length > 0) {
        statements.push(
          db
            .prepare(
              `INSERT INTO transaction_tags (transaction_id, tag_id)
               SELECT ${lastTransactionId}, id FROM tags
               WHERE user_id = ? AND id IN (SELECT value FROM json_each(?))`,
            )
            .bind(userId, JSON.stringify(tagIds)),
        );
      }

      for (const split of splits) {
        statements.push(
          db
            .prepare(
              `INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage)
               VALUES (${lastTransactionId}, ?, ?, ?)`,
            )
            .bind(
              split.user_id,
              Math.round((amount * split.percentage) / 100),
              split.percentage,
            ),
        );
      }
    });

    const results = await db.batch<Record<string, unknown>>(statements);
    const first = results[insertIndexes[0]!]!.results[0] as {
      id: number;
    } & Record<string, unknown>;

    let finalSplits: unknown[] = [];
    if (splits.length > 0) {
      const splitsResult = await db
        .prepare(
          `SELECT ts.*, sgm.nickname
           FROM transaction_splits ts
           LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
           WHERE ts.transaction_id = ?`,
        )
        .bind(groupId, first.id)
        .all();
      finalSplits = splitsResult.results;
    }

    return {
      success: true,
      transaction: {
        ...first,
        tag_ids: tagIds,
        splits: finalSplits,
      },
    };
  }
}
