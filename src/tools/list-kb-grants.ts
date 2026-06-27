/**
 * list_kb_grants Tool
 *
 * List YOUR active property KB grants (your own standing consent).
 * Required scope: knowledge:read
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listKbGrantsTool: Tool = {
  name: 'list_kb_grants',
  description: `List the property Knowledge-Base grants YOU have approved (your own standing consent).

**What is a grant?**
A per-user permission that lets one of your running consumer properties reach a producer property's KB namespace — within YOUR own data. Grants are always yours (the calling user's); you never see another user's grants. This is the headless equivalent of the web /knowledge/access page.

Returns each grant's id, consumer, owner (producer) namespace, permission, optional category scope, and origin.

Related: \`grant_kb_access\` (create), \`revoke_kb_access\` (revoke), \`list_property_kb_links\` (the design-time links).`,
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
};

export async function handleListKbGrants(
  client: FlowDotApiClient,
  _args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const grants = await client.listKbGrants();

    if (grants.length === 0) {
      return { content: [{ type: 'text', text: 'You have no active property KB grants.' }] };
    }

    const lines = grants.map((g) => {
      const consumer = `${g.consumer.kind} ${g.consumer.name ?? g.consumer.ref}`;
      const owner =
        g.owner.kind === 'human'
          ? 'your general knowledge'
          : `${g.owner.kind} ${g.owner.name ?? g.owner.ref ?? ''}`.trim();
      const scope = g.category_scope ? ` [category ${g.category_scope}]` : '';
      return `- (id ${g.id}) **${consumer}** → ${owner} — ${g.permission}${scope}`;
    });

    return { content: [{ type: 'text', text: `Your active KB grants:\n\n${lines.join('\n')}` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error listing KB grants: ${message}` }], isError: true };
  }
}
