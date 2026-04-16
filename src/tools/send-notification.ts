import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const sendNotificationTool: Tool = {
  name: 'send_notification',
  description:
    'Send a notification message to the user via their configured COMMS channels (Telegram, Discord, Slack, Signal). ' +
    'The message is delivered to all enabled and verified channels unless filtered by channel_types. ' +
    'Use list_comms_channels to see available channels first.',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The notification message to send (max 2000 characters)',
      },
      title: {
        type: 'string',
        description: 'Optional title for the notification (default: "FlowDot")',
      },
      channel_types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional filter — only send to specific channel types (e.g., ["telegram", "discord"])',
      },
    },
    required: ['message'],
  },
};

export async function handleSendNotification(
  api: FlowDotApiClient,
  args: { message: string; title?: string; channel_types?: string[] }
): Promise<CallToolResult> {
  try {
    const result = await api.sendNotification({
      message: args.message,
      title: args.title,
      channel_types: args.channel_types,
    });

    if (!result.results || result.results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No channels available to send notifications. Configure channels at https://flowdot.ai/communications.',
        }],
      };
    }

    const lines = result.results.map((r) => {
      const status = r.success ? 'sent' : `failed: ${r.error || 'unknown error'}`;
      return `- **${r.channel}** (${r.type}): ${status}`;
    });

    const successCount = result.results.filter(r => r.success).length;

    return {
      content: [{
        type: 'text',
        text: `Notification delivered to ${successCount}/${result.channels_attempted} channel(s):\n\n${lines.join('\n')}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error sending notification: ${message}` }],
      isError: true,
    };
  }
}
