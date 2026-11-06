import { Bool, Num, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, Transaction } from '../types';
import { type SplitInput, splitRows, splitWeights } from '../utils/splits';

export class TransactionUpdate extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'Update an existing Transaction',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({
        id: Num({ description: 'Transaction ID' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: Transaction.omit({
              id: true,
              created_at: true,
              installments: true,
              installment_number: true,
              installment_total: true,
            }).partial(),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the updated transaction',
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
      '404': {
        description: 'Transaction not found',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;
    const updates = data.body;
    const userId = c.get('userId');

    // Fetch existing
    const existing = (await c.env.DB.prepare(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ?`,
    )
      .bind(id, userId)
      .first()) as any;
    if (!existing) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }

    const newTitle = updates.title ?? existing.title;
    const newAmount = updates.amount ?? existing.amount;
    const newCategory = updates.category_id ?? existing.category_id;
    const newType = updates.type ?? existing.type;
    const newAccount = updates.account_id ?? existing.account_id;
    const newDate = updates.date ?? existing.date;
    const newIsShared =
      updates.is_shared !== undefined
        ? updates.is_shared
          ? 1
          : 0
        : existing.is_shared;
    const newGroupId = !newIsShared
      ? null
      : updates.group_id !== undefined
        ? updates.group_id
        : existing.group_id;

    // Fetch existing tags to prefill if no change
    let currentTagIds: number[] = [];
    if (updates.tag_ids === undefined) {
      const existingTagsResult = await c.env.DB.prepare(
        `SELECT tag_id FROM transaction_tags WHERE transaction_id = ?`,
      )
        .bind(id)
        .all();
      currentTagIds = existingTagsResult.results.map((r: any) => r.tag_id);
    }

    // New parts when they are sent, or the current ones spread over a new amount.
    let splitInputs: SplitInput[] | null = null;
    if (!newIsShared) {
      splitInputs = [];
    } else if (updates.splits !== undefined) {
      splitInputs = updates.splits as SplitInput[];
    } else if (newAmount !== existing.amount) {
      const current = await c.env.DB.prepare(
        `SELECT user_id, amount FROM transaction_splits WHERE transaction_id = ? ORDER BY id`,
      )
        .bind(id)
        .all<{ user_id: string; amount: number }>();
      splitInputs = current.results.map((s) => ({
        user_id: s.user_id,
        percentage: s.amount,
      }));
    }

    let splitStatements: D1PreparedStatement[] = [];
    if (splitInputs !== null) {
      if (splitInputs.length > 0) {
        const members = await c.env.DB.prepare(
          `SELECT user_id FROM shared_group_members WHERE group_id = ?`,
        )
          .bind(newGroupId)
          .all<{ user_id: string }>();
        const memberIds = new Set(members.results.map((m) => m.user_id));
        if (!memberIds.has(userId)) {
          return c.json(
            { success: false, error: 'You are not a member of this group' },
            403,
          );
        }
        if (splitInputs.some((s) => !memberIds.has(s.user_id))) {
          return c.json(
            {
              success: false,
              error: 'Split users must be members of the group',
            },
            400,
          );
        }
      }
      // Current parts are re-spread by their amounts, sent as weights.
      const resolved =
        updates.splits !== undefined
          ? splitWeights(newAmount, splitInputs)
          : { weights: splitInputs.map((s) => s.percentage!) };
      if ('error' in resolved) {
        return c.json({ success: false, error: resolved.error }, 400);
      }
      splitStatements = [
        c.env.DB.prepare(
          `DELETE FROM transaction_splits WHERE transaction_id = ?`,
        ).bind(id),
        ...splitRows(
          newAmount,
          splitInputs.map((s) => s.user_id),
          resolved.weights,
        ).map((split) =>
          c.env.DB.prepare(
            `INSERT INTO transaction_splits (transaction_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)`,
          ).bind(id, split.user_id, split.amount, split.percentage),
        ),
      ];
    }

    const tagStatements =
      updates.tag_ids === undefined
        ? []
        : [
            c.env.DB.prepare(
              `DELETE FROM transaction_tags WHERE transaction_id = ?`,
            ).bind(id),
            ...updates.tag_ids.map((tId) =>
              c.env.DB.prepare(
                `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
              ).bind(id, tId),
            ),
          ];

    const [updated] = await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE transactions SET title = ?, amount = ?, category_id = ?, type = ?, account_id = ?, date = ?, is_shared = ?, group_id = ? WHERE id = ? AND user_id = ? RETURNING *`,
      ).bind(
        newTitle,
        newAmount,
        newCategory,
        newType,
        newAccount,
        newDate,
        newIsShared,
        newGroupId,
        id,
        userId,
      ),
      ...tagStatements,
      ...splitStatements,
    ]);
    const txResult = updated?.results[0] as Record<string, unknown>;

    // Fetch current splits for response
    const splitsResult = await c.env.DB.prepare(
      `
			SELECT ts.*, sgm.nickname 
			FROM transaction_splits ts
			LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
			WHERE ts.transaction_id = ?
		`,
    )
      .bind(newGroupId, id)
      .all();
    const finalSplits = splitsResult.results;

    const finalTags =
      updates.tag_ids !== undefined ? updates.tag_ids : currentTagIds;

    return {
      success: true,
      transaction: { ...txResult, tag_ids: finalTags, splits: finalSplits },
    };
  }
}
