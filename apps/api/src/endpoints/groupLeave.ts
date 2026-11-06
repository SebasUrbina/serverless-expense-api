import { Bool, OpenAPIRoute, Num } from 'chanfana';
import { z } from 'zod';
import { ErrorResponse, type AppContext } from '../types';
import {
  deleteGroupStatements,
  groupNets,
  hasDebt,
} from '../utils/groupBalance';

const errorContent = { 'application/json': { schema: ErrorResponse } };

export class GroupLeave extends OpenAPIRoute {
  schema = {
    tags: ['Groups'],
    summary: 'Leave a group',
    description:
      'Only with a settled balance. If the creator leaves, the member who joined next becomes the creator. The last member leaving deletes the group, and its movements become personal movements of whoever paid them.',
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    request: {
      params: z.object({ id: Num({ description: 'Group ID' }) }),
    },
    responses: {
      '200': {
        description: 'Left the group',
        content: {
          'application/json': {
            schema: z.object({
              success: Bool(),
              group_deleted: Bool(),
            }),
          },
        },
      },
      '404': { description: 'Not a member', content: errorContent },
      '409': {
        description: 'The member still owes or is owed',
        content: {
          'application/json': {
            schema: ErrorResponse.extend({ net: Num() }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const userId = c.get('userId');
    const groupId = data.params.id;

    const members = await groupNets(c.env.DB, groupId);
    const me = members.find((m) => m.user_id === userId);
    if (!me) {
      return c.json(
        { success: false, error: 'Not a member of this group' },
        404,
      );
    }
    if (hasDebt(me.net)) {
      return c.json(
        {
          success: false,
          error: 'Settle up before leaving the group',
          net: Math.round(me.net),
        },
        409,
      );
    }

    if (members.length === 1) {
      await c.env.DB.batch(deleteGroupStatements(c.env.DB, groupId));
      return { success: true, group_deleted: true };
    }

    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE shared_groups SET created_by = (
           SELECT user_id FROM shared_group_members
           WHERE group_id = ?1 AND user_id != ?2
           ORDER BY joined_at, rowid LIMIT 1
         ) WHERE id = ?1 AND created_by = ?2`,
      ).bind(groupId, userId),
      c.env.DB.prepare(
        `DELETE FROM shared_group_members WHERE group_id = ? AND user_id = ?`,
      ).bind(groupId, userId),
    ]);
    return { success: true, group_deleted: false };
  }
}
