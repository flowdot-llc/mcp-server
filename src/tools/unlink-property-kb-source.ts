/**
 * unlink_property_kb_source Tool
 *
 * Remove a KB-source link by id (owner-only).
 * Required scope: knowledge:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const unlinkPropertyKbSourceTool: Tool = {
  name: 'unlink_property_kb_source',
  description: `Remove a Knowledge-Base source link from a property you own, by its link id (get the id from \`list_property_kb_links\`).

After unlinking, the consumer can no longer resolve that alias. Existing per-user grants for the target namespace are not deleted, but the alias they were reached through is gone — update the consumer's code to stop using it.

**Ownership:** you can only remove links from a property you own.

Related: \`list_property_kb_links\`, \`link_property_kb_source\`.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      link_id: {
        type: 'number',
        description: 'The link id to remove (from list_property_kb_links)',
      },
    },
    required: ['link_id'],
  },
};

export async function handleUnlinkPropertyKbSource(
  client: FlowDotApiClient,
  args: { link_id: number }
): Promise<CallToolResult> {
  try {
    await client.deletePropertyKbLink(args.link_id);
    return { content: [{ type: 'text', text: `KB-source link ${args.link_id} removed.` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error removing KB-source link: ${message}` }], isError: true };
  }
}
