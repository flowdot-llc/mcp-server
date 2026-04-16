import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listCommsChannelsTool: Tool = {
  name: 'list_comms_channels',
  description:
    'List the user\'s configured notification channels (Telegram, Discord, Slack, Signal). ' +
    'Shows which channels are enabled, verified, and their priority order. ' +
    'These channels are used by send_notification to deliver messages.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleListCommsChannels(
  api: FlowDotApiClient
): Promise<CallToolResult> {
  try {
    const channels = await api.listCommsChannels();

    if (!Array.isArray(channels) || channels.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No notification channels configured. Set up Telegram, Discord, Slack, or Signal at https://flowdot.ai/communications.',
        }],
      };
    }

    const lines = channels.map((ch) => {
      const status: string[] = [];
      if (ch.is_enabled) status.push('enabled');
      else status.push('disabled');
      if (ch.is_verified) status.push('verified');
      else status.push('unverified');

      return `- **${ch.name}** (${ch.channel_type}) — ${status.join(', ')} — priority ${ch.priority}`;
    });

    return {
      content: [{
        type: 'text',
        text: `Found ${channels.length} notification channel(s):\n\n${lines.join('\n')}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing channels: ${message}` }],
      isError: true,
    };
  }
}
