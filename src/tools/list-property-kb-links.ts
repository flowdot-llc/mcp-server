/**
 * list_property_kb_links Tool
 *
 * List the design-time KB-source links declared on a consumer property you own.
 * Required scope: knowledge:read
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listPropertyKbLinksTool: Tool = {
  name: 'list_property_kb_links',
  description: `List the Knowledge-Base source links declared on a property you OWN (app, recipe, toolkit, or workflow).

**What is a KB-source link?**
A design-time declaration on a consumer property that it intends to read/write another property's KB namespace, addressed by a stable \`alias\`. The link carries NO user data — it just tells the consumer which target namespace an alias maps to. The per-user permission to actually read that data is a separate **grant** (see \`grant_kb_access\`). Links travel with the definition on clone/fork.

**Ownership:** you can only list links for a property you own.

Returns each link's id, alias, target namespace (kind + ref + name), and default permission.

Related: \`link_property_kb_source\` (declare), \`unlink_property_kb_source\` (remove), \`grant_kb_access\` (a runner's consent).`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      consumer_kind: {
        type: 'string',
        enum: ['app', 'recipe', 'toolkit', 'workflow'],
        description: 'The kind of property that owns the links',
      },
      consumer_ref: {
        type: 'string',
        description: 'The consumer property hash',
      },
    },
    required: ['consumer_kind', 'consumer_ref'],
  },
};

export async function handleListPropertyKbLinks(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const consumerKind = String(args.consumer_kind) as 'app' | 'recipe' | 'toolkit' | 'workflow';
    const consumerRef = String(args.consumer_ref);

    const links = await client.listPropertyKbLinks(consumerKind, consumerRef);

    if (links.length === 0) {
      return { content: [{ type: 'text', text: `No KB-source links on ${consumerKind} ${consumerRef}.` }] };
    }

    const lines = links.map(
      (l) =>
        `- **${l.alias}** → ${l.target.kind}${l.target.ref ? ` \`${l.target.ref}\`` : ''}` +
        `${l.target.name ? ` (${l.target.name})` : ''} — ${l.default_permission} (id ${l.id})`
    );

    return {
      content: [{ type: 'text', text: `KB-source links on ${consumerKind} ${consumerRef}:\n\n${lines.join('\n')}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error listing KB-source links: ${message}` }], isError: true };
  }
}
