import { Bool, Num, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';

export class TransactionDelete extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'Delete a Transaction',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({
        id: Num({ description: 'Transaction ID' }),
      }),
    },
    responses: {
      '200': {
        description: 'Successfully deleted',
        content: {
          'application/json': {
            schema: z.object({
              series: z.object({
                success: Bool(),
              }),
            }),
          },
        },
      },
      '403': {
        description:
          'Shared movement of a group the caller left; it can no longer be changed',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
      '404': {
        description:
          'Transaction not found, or recorded by someone else (only its owner can delete it)',
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
    const userId = c.get('userId');

    // Only whoever recorded a movement deletes it, shared or not.
    const tx = await c.env.DB.prepare(
      `SELECT t.id, t.is_shared, t.group_id,
         EXISTS (
           SELECT 1 FROM shared_group_members m
           WHERE m.group_id = t.group_id AND m.user_id = t.user_id
         ) AS is_member
       FROM transactions t WHERE t.id = ? AND t.user_id = ?`,
    )
      .bind(id, userId)
      .first<{
        id: number;
        is_shared: number;
        group_id: number | null;
        is_member: number;
      }>();

    if (!tx) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }
    if (tx.is_shared && tx.group_id != null && !tx.is_member) {
      return c.json(
        {
          success: false,
          error: 'You left this group; its movements can no longer be changed',
        },
        403,
      );
    }

    // Clean up splits and tags first, then delete the transaction
    await c.env.DB.batch([
      c.env.DB.prepare(
        `DELETE FROM transaction_splits WHERE transaction_id = ?`,
      ).bind(id),
      c.env.DB.prepare(
        `DELETE FROM transaction_tags WHERE transaction_id = ?`,
      ).bind(id),
      c.env.DB.prepare(
        `DELETE FROM transactions WHERE id = ? AND user_id = ?`,
      ).bind(id, userId),
    ]);

    return {
      success: true,
    };
  }
}
