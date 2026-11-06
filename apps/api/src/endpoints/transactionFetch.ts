import { Bool, Num, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, Transaction } from '../types';

export class TransactionFetch extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'Get a Transaction by ID',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({
        id: Num({ description: 'Transaction ID' }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns a single transaction',
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
    const userId = c.get('userId');

    const result = (await c.env.DB.prepare(
      `
			SELECT 
				t.*, 
				c.name as category,
				c.icon as category_icon,
				a.name as account,
				(SELECT json_group_array(tag_id) FROM transaction_tags WHERE transaction_id = t.id) as tag_ids,
				sg.name as group_name
			FROM transactions t
			LEFT JOIN categories c ON t.category_id = c.id
			LEFT JOIN accounts a ON t.account_id = a.id
			LEFT JOIN shared_groups sg ON t.group_id = sg.id
			WHERE t.id = ?1 AND (t.user_id = ?2 OR (
				t.is_shared = 1
				AND EXISTS (SELECT 1 FROM transaction_splits WHERE transaction_id = t.id AND user_id = ?2)
				AND EXISTS (SELECT 1 FROM shared_group_members WHERE group_id = t.group_id AND user_id = ?2)
			))
		`,
    )
      .bind(id, userId)
      .first()) as any;

    if (!result) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }

    // Fetch splits with nicknames
    let splits: any[] = [];
    if (result.is_shared && result.group_id) {
      const splitsResult = await c.env.DB.prepare(
        `
				SELECT ts.*, sgm.nickname 
				FROM transaction_splits ts
				LEFT JOIN shared_group_members sgm ON sgm.user_id = ts.user_id AND sgm.group_id = ?
				WHERE ts.transaction_id = ?
			`,
      )
        .bind(result.group_id, id)
        .all();
      splits = splitsResult.results;
    }

    return {
      success: true,
      transaction: {
        ...result,
        tag_ids: JSON.parse(result.tag_ids || '[]'),
        splits,
      },
    };
  }
}
