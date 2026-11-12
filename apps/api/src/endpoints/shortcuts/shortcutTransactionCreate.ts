import { Bool, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, Transaction } from '../../types';
import { parseAmount } from '../../utils/parseAmount';
import {
  type CategoryOption,
  decideWithBinding,
  suggestCategory,
} from '../../services/categorize';

export class ShortcutTransactionCreate extends OpenAPIRoute {
  schema = {
    tags: ['Shortcuts', 'Transactions'],
    summary: 'Create a Transaction via iOS Shortcuts',
    description:
      "Simplified transaction creation for iOS Shortcuts / Wallet automations. Category and account are optional. Without a matching category_name the title is classified with Workers AI (Clef-flash) and, when the model is unsure or unavailable, falls back to 'Sin Categorizar'; accounts fall back to 'Sin Asignar'. Type defaults to expense.",
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              title: z.string().trim().min(1, 'Title is required'),
              amount: z.preprocess(
                parseAmount,
                z.number().positive('Amount must be positive'),
              ),
              type: z.enum(['expense', 'income']).default('expense'),
              category_name: z.string().trim().optional(),
              account_name: z.string().trim().optional(),
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
    const type = t.type;

    // 1. Resolve Category (by name → fallback "Sin Categorizar")
    let categoryId: number | null = null;
    if (t.category_name) {
      const cat = await c.env.DB.prepare(
        `SELECT id FROM categories 
				 WHERE user_id = ? AND type = ? 
				 AND (name = ? OR icon || ' ' || name = ?)`,
      )
        .bind(userId, type, t.category_name, t.category_name)
        .first<{ id: number }>();
      if (cat) categoryId = cat.id;
    }
    if (!categoryId && c.env.AI) {
      const { results: categories } = await c.env.DB.prepare(
        `SELECT id, name, icon FROM categories WHERE user_id = ? AND type = ?`,
      )
        .bind(userId, type)
        .all<CategoryOption>();
      const suggestion = await suggestCategory(
        decideWithBinding(c.env.AI),
        { title: t.title, amount: t.amount, type },
        categories,
      );
      if (suggestion) {
        categoryId = suggestion.categoryId;
        console.log('categorize', {
          title: t.title,
          categoryId,
          confidence: suggestion.confidence,
          inputTokens: suggestion.inputTokens,
        });
      }
    }
    if (!categoryId) {
      const fallback = await c.env.DB.prepare(
        `SELECT id FROM categories WHERE user_id = ? AND type = ? AND name = 'Sin Categorizar'`,
      )
        .bind(userId, type)
        .first<{ id: number }>();
      if (!fallback) {
        return c.json(
          {
            success: false,
            error:
              "Default category 'Sin Categorizar' not found. Run user setup first.",
          },
          400,
        );
      }
      categoryId = fallback.id;
    }

    // 2. Resolve Account (exact → partial match → fallback "Sin Asignar")
    let accountId: number | null = null;
    if (t.account_name) {
      // Exact match
      const exact = await c.env.DB.prepare(
        `SELECT id FROM accounts WHERE user_id = ? AND name = ?`,
      )
        .bind(userId, t.account_name)
        .first<{ id: number }>();
      if (exact) {
        accountId = exact.id;
      } else {
        // Partial: check if any account name is contained in the card string
        const partial = await c.env.DB.prepare(
          `SELECT id FROM accounts WHERE user_id = ? AND ? LIKE '%' || name || '%' AND name != 'Sin Asignar' LIMIT 1`,
        )
          .bind(userId, t.account_name)
          .first<{ id: number }>();
        if (partial) accountId = partial.id;
      }
    }
    if (!accountId) {
      const fallback = await c.env.DB.prepare(
        `SELECT id FROM accounts WHERE user_id = ? AND name = 'Sin Asignar'`,
      )
        .bind(userId)
        .first<{ id: number }>();
      if (!fallback) {
        return c.json(
          {
            success: false,
            error:
              "Default account 'Sin Asignar' not found. Run user setup first.",
          },
          400,
        );
      }
      accountId = fallback.id;
    }

    const today = new Date().toISOString().split('T')[0];

    // 3. Insert Transaction
    const txResult = (await c.env.DB.prepare(
      `INSERT INTO transactions (title, amount, category_id, type, account_id, user_id, date, is_shared, group_id) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL) RETURNING *`,
    )
      .bind(t.title, t.amount, categoryId, type, accountId, userId, today)
      .first()) as any;

    return {
      success: true,
      transaction: txResult,
    };
  }
}
