import { Bool, OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import type { AppContext } from '../types';
import { invalidateApiKeyCache } from '../middleware/auth';

export class ApiKeyGenerate extends OpenAPIRoute {
  schema = {
    tags: ['API Keys'],
    summary: 'Generate a new User API Key',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    responses: {
      '200': {
        description:
          'Creates and returns a new static API key for the user (revokes previous)',
        content: {
          'application/json': {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  key: Str(),
                }),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const userId = c.get('userId');

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const newKey = `sk-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;

    // Replace any existing key atomically so the user always has exactly one
    await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM api_keys WHERE user_id = ?`).bind(userId),
      c.env.DB.prepare(
        `INSERT INTO api_keys (key, user_id) VALUES (?, ?)`,
      ).bind(newKey, userId),
    ]);
    invalidateApiKeyCache(userId);

    return {
      success: true,
      key: newKey,
    };
  }
}
