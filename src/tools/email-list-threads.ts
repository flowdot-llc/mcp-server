import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailListThreadsTool: Tool = {
  name: 'email_list_threads',
  description:
    'List email threads from a connected mailbox. Returns recent threads with subject, participants, and message count. ' +
    'Use list_email_integrations first to get the integration_id.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID (from list_email_integrations)',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of threads to return (default: 10)',
      },
      label: {
        type: 'string',
        description: 'Filter by label (e.g., "INBOX", "SENT", "STARRED")',
      },
    },
    required: ['integration_id'],
  },
};

export async function handleEmailListThreads(
  api: FlowDotApiClient,
  args: { integration_id: number; max_results?: number; label?: string }
): Promise<CallToolResult> {
  try {
    const payload: Record<string, unknown> = {};
    if (args.max_results) payload.limit = args.max_results;
    if (args.label) payload.label = args.label;

    const result = await api.callEmailTool('list-threads', {
      integration_id: args.integration_id,
      payload,
    });

    return {
      content: [{
        type: 'text',
        text: `Email threads:\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing threads: ${message}` }],
      isError: true,
    };
  }
}
