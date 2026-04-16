import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailDeleteTool: Tool = {
  name: 'email_delete',
  description: 'Move an email message to trash. Subject to mailbox grant permissions. This is a soft delete (trash), not permanent.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to delete (move to trash)',
      },
    },
    required: ['integration_id', 'message_id'],
  },
};

export async function handleEmailDelete(
  api: FlowDotApiClient,
  args: { integration_id: number; message_id: string }
): Promise<CallToolResult> {
  try {
    await api.callEmailTool('delete', {
      integration_id: args.integration_id,
      payload: { message_id: args.message_id },
    });

    return {
      content: [{ type: 'text', text: `Message ${args.message_id} moved to trash.` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting email: ${message}` }],
      isError: true,
    };
  }
}
