import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailSearchTool: Tool = {
  name: 'email_search',
  description:
    'Search emails in a connected mailbox. Requires an active email integration. ' +
    'Use list_email_integrations first to get the integration_id. ' +
    'Returns matching messages with subject, from, date, and snippet.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID (from list_email_integrations)',
      },
      query: {
        type: 'string',
        description: 'Search query (e.g., "from:alice subject:invoice", "is:unread", "newer_than:7d")',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
      },
    },
    required: ['integration_id', 'query'],
  },
};

export async function handleEmailSearch(
  api: FlowDotApiClient,
  args: { integration_id: number; query: string; max_results?: number }
): Promise<CallToolResult> {
  try {
    const result = await api.callEmailTool('search', {
      integration_id: args.integration_id,
      payload: {
        q: args.query,
        max: args.max_results ?? 10,
      },
    });

    return {
      content: [{ type: 'text', text: formatEmailResult('Search', result) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error searching emails: ${message}` }],
      isError: true,
    };
  }
}

function formatEmailResult(action: string, result: unknown): string {
  if (typeof result === 'object' && result !== null) {
    return `Email ${action} result:\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
  }
  return `Email ${action} result: ${String(result)}`;
}
