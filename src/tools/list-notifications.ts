import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listNotificationsTool: Tool = {
  name: 'list_notifications',
  description:
    'List recent notifications for the authenticated user. Shows comments, replies, votes, and other activity. ' +
    'Returns unread count and notification details.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of notifications to return (default: 20, max: 50)',
      },
    },
  },
};

export async function handleListNotifications(
  api: FlowDotApiClient,
  args: { limit?: number }
): Promise<CallToolResult> {
  try {
    const result = await api.listNotifications(args.limit);

    const notifications = result.notifications;
    if (!notifications || notifications.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No notifications. Unread count: ${result.unread_count}`,
        }],
      };
    }

    const lines = notifications.map((n) => {
      const readMark = n.is_read ? '' : ' (unread)';
      const actor = n.actor ? `**${n.actor.name}**` : 'System';
      return `- ${actor}: ${n.message}${readMark} — ${n.created_at}`;
    });

    return {
      content: [{
        type: 'text',
        text: `**${result.unread_count} unread** | Showing ${notifications.length} notification(s):\n\n${lines.join('\n')}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing notifications: ${message}` }],
      isError: true,
    };
  }
}
