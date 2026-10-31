import { Bool, Num, OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext, Transaction } from '../types';
import { todayLocal } from '../utils/date';

export class TransactionList extends OpenAPIRoute {
  schema = {
    tags: ['Transactions'],
    summary: 'List Transactions',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      query: z.object({
        search: Str({
          description: 'Search by title (case-insensitive)',
          required: false,
        }),
        category_id: Num({
          description: 'Filter by category ID',
          required: false,
        }),
        tag_id: Num({
          description: 'Filter by tag ID',
          required: false,
        }),
        type: Str({
          description: 'Filter by type (expense/income)',
          required: false,
        }),
        startDate: Str({
          description: 'Filter transactions from this date (YYYY-MM-DD)',
          required: false,
        }),
        endDate: Str({
          description: 'Filter transactions up to this date (YYYY-MM-DD)',
          required: false,
        }),
        is_shared: Num({
          description: 'Filter shared transactions only (1 = shared)',
          required: false,
        }),
        group_id: Num({
          description: 'Filter by group ID',
          required: false,
        }),
        page: Num({
          description: 'Page number for pagination',
          required: false,
          default: 1,
        }),
        limit: Num({
          description: 'Number of items per page',
          required: false,
          default: 20,
        }),
      }),
    },
    responses: {
      '200': {
        description: 'Returns a list of transactions',
        content: {
          'application/json': {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  transactions: Transaction.array(),
                  hasMore: Bool(),
                  nextPage: Num().nullable(),
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
    const {
      search,
      category_id,
      tag_id,
      type,
      startDate,
      endDate,
      is_shared,
      group_id,
      page,
      limit,
    } = data.query;
    const userId = c.get('userId');

    const filters: string[] = [];
    const filterBinds: unknown[] = [];

    if (search) {
      filters.push(`LOWER(t.title) LIKE LOWER(?)`);
      filterBinds.push(`%${search}%`);
    }
    if (category_id) {
      filters.push(`t.category_id = ?`);
      filterBinds.push(category_id);
    }
    if (tag_id) {
      filters.push(
        `EXISTS (SELECT 1 FROM transaction_tags tt WHERE tt.transaction_id = t.id AND tt.tag_id = ?)`,
      );
      filterBinds.push(tag_id);
    }
    if (type) {
      filters.push(`t.type = ?`);
      filterBinds.push(type);
    }
    if (startDate) {
      filters.push(`t.date >= ?`);
      filterBinds.push(startDate);
    }
    filters.push(`t.date <= ?`);
    filterBinds.push(endDate || todayLocal());
    if (is_shared) {
      filters.push(`t.is_shared = 1`);
    }
    if (group_id) {
      filters.push(`t.group_id = ?`);
      filterBinds.push(group_id);
    }
    const where = filters.map((f) => ` AND ${f}`).join('');

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.max(1, Math.min(100, limit || 20)); // Max 100 items per page
    const offset = (safePage - 1) * safeLimit;
    // Fetch 1 extra item to easily check if there are more pages
    const window = offset + safeLimit + 1;
    const order = `t.date DESC, t.created_at DESC, t.id DESC`;

    // D1 bills every row scanned. Owned and split-with-me rows are paged separately
    // (each capped at offset + limit) so the scan walks the index and stops early,
    // and the joins only run for the rows of the requested page.
    const query = `
			WITH page AS (
				SELECT id, date, created_at FROM (
					SELECT t.id, t.date, t.created_at FROM transactions t
					WHERE t.user_id = ?${where}
					ORDER BY ${order} LIMIT ?
				)
				UNION ALL
				SELECT id, date, created_at FROM (
					SELECT t.id, t.date, t.created_at FROM transaction_splits s
					JOIN transactions t ON t.id = s.transaction_id
					WHERE s.user_id = ? AND t.user_id != s.user_id${where}
					ORDER BY ${order} LIMIT ?
				)
				ORDER BY date DESC, created_at DESC, id DESC
				LIMIT ? OFFSET ?
			)
			SELECT
				t.*,
				c.name as category,
				c.icon as category_icon,
				a.name as account,
				(SELECT json_group_array(json_object('id', tt.tag_id, 'name', COALESCE(tg.name, 'Unknown'))) FROM transaction_tags tt LEFT JOIN tags tg ON tg.id = tt.tag_id WHERE tt.transaction_id = t.id) as tag_data,
				ts_me.amount as my_split_amount,
				ts_me.percentage as my_split_percentage,
				sg.name as group_name
			FROM page
			JOIN transactions t ON t.id = page.id
			LEFT JOIN categories c ON t.category_id = c.id
			LEFT JOIN accounts a ON t.account_id = a.id
			LEFT JOIN transaction_splits ts_me ON ts_me.transaction_id = t.id AND ts_me.user_id = ?
			LEFT JOIN shared_groups sg ON t.group_id = sg.id
			ORDER BY ${order}
		`;
    const binds = [
      userId,
      ...filterBinds,
      window,
      userId,
      ...filterBinds,
      window,
      safeLimit + 1,
      offset,
      userId,
    ];

    const result = await c.env.DB.prepare(query)
      .bind(...binds)
      .all();
    const allTx = result.results.map((tx: any) => {
      const tagData = JSON.parse(tx.tag_data || '[]');
      return {
        ...tx,
        tag_ids: tagData.map((t: any) => t.id),
        tag_names: tagData.map((t: any) => t.name),
        tag_data: undefined,
        is_owner: tx.user_id === userId,
      };
    });

    const hasMore = allTx.length > safeLimit;
    const returnTx = hasMore ? allTx.slice(0, safeLimit) : allTx;

    return {
      success: true,
      transactions: returnTx,
      hasMore: hasMore,
      nextPage: hasMore ? safePage + 1 : null,
    };
  }
}
