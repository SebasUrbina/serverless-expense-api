import { Bool, Num, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';
import {
  deleteGroupStatements,
  groupNets,
  hasDebt,
} from '../utils/groupBalance';

export class GroupDelete extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Delete a shared group (creator only)',
    description:
      "Only when every member is settled up. The group's movements become personal movements of whoever paid them.",
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({
        id: Num({ description: 'Group ID' }),
      }),
    },
    responses: {
      '200': {
        description: 'Group deleted successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              message: z.string(),
            }),
          },
        },
      },
      '409': {
        description: 'Someone still owes or is owed',
        content: {
          'application/json': {
            schema: z.object({ success: Bool(), error: z.string() }),
          },
        },
      },
      '404': {
        description: 'Group not found or not authorized',
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

    // Check if group exists and user is the creator
    const group = await c.env.DB.prepare(
      `SELECT * FROM shared_groups WHERE id = ? AND created_by = ?`,
    )
      .bind(id, userId)
      .first();

    if (!group) {
      return c.json(
        { success: false, error: 'Group not found or you are not the creator' },
        404,
      );
    }

    const members = await groupNets(c.env.DB, id);
    if (members.some((m) => hasDebt(m.net))) {
      return c.json(
        {
          success: false,
          error: 'Everyone must be settled up before deleting the group',
        },
        409,
      );
    }

    await c.env.DB.batch(deleteGroupStatements(c.env.DB, id));

    return {
      success: true,
      message: 'Group deleted successfully',
    };
  }
}
