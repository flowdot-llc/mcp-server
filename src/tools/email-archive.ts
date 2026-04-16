import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailArchiveTool: Tool = {
  name: 'email_archive',
  description: 'Archive an email message (removes from inbox). Subject to mailbox grant permissions.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to archive',
      },
    },
    required: ['integration_id', 'message_id'],
  },
};

export async function handleEmailArchive(
  api: FlowDotApiClient,
  args: { integration_id: number; message_id: string }
): Promise<CallToolResult> {
  try {
    await api.callEmailTool('archive', {
      integration_id: args.integration_id,
      payload: { message_id: args.message_id },
    });

    return {
      content: [{ type: 'text', text: `Message ${args.message_id} archived.` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error archiving email: ${message}` }],
      isError: true,
    };
  }
}
