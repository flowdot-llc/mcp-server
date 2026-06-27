/**
 * revoke_kb_access Tool
 *
 * Revoke one of YOUR property KB grants by id (re-isolates immediately).
 * Required scope: knowledge:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const revokeKbAccessTool: Tool = {
  name: 'revoke_kb_access',
  description: `Revoke one of YOUR Knowledge-Base grants by its grant id (get it from \`list_kb_grants\`). The consumer property is re-isolated from that namespace immediately.

You can only revoke your own grants. Related: \`list_kb_grants\`, \`grant_kb_access\`.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      grant_id: {
        type: 'number',
        description: 'The grant id to revoke (from list_kb_grants)',
      },
    },
    required: ['grant_id'],
  },
};

export async function handleRevokeKbAccess(
  client: FlowDotApiClient,
  args: { grant_id: number }
): Promise<CallToolResult> {
  try {
    const result = await client.revokeKbGrant(args.grant_id);
    return {
      content: [
        {
          type: 'text',
          text: result.revoked ? `Grant ${args.grant_id} revoked.` : `No active grant ${args.grant_id} found for you.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error revoking KB access: ${message}` }], isError: true };
  }
}
