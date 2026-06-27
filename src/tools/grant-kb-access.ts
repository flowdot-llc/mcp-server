/**
 * grant_kb_access Tool
 *
 * Create/upsert a standing property KB grant for the calling user.
 * Required scope: knowledge:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const grantKbAccessTool: Tool = {
  name: 'grant_kb_access',
  description: `Approve a standing Knowledge-Base grant FOR YOURSELF — let one of your running consumer properties read/write a producer property's KB namespace, within your own data.

**This is the runner's consent, headless.** On web/mobile the runner approves a consent modal. CLI/MCP and other headless surfaces have NO modal — A.5.3 makes them fail-closed unless a standing grant exists. This tool is that standing grant: the headless equivalent of the /knowledge/access page.

**CRITICAL — security:**
- The grant is ALWAYS bound to YOU (the calling token's user); you cannot grant on behalf of anyone else.
- You must be able to view both the consumer and the producer property.
- A property can never self-grant — only you (a human) can.
- Every document then read/written is still YOUR own data in that namespace; a grant never exposes another user's documents.

**Owner kinds:** \`app\` | \`recipe\` | \`toolkit\` | \`workflow\` (give \`owner_ref\`), or \`human\` (your own general knowledge — omit \`owner_ref\`).

\`\`\`json
{
  "consumer_kind": "app", "consumer_ref": "APP_HASH",
  "owner_kind": "recipe", "owner_ref": "RECIPE_HASH",
  "permission": "read_write"
}
\`\`\`

Re-granting the same (consumer, owner) UPDATES the permission. Related: \`list_kb_grants\`, \`revoke_kb_access\`, \`link_property_kb_source\`.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      consumer_kind: {
        type: 'string',
        enum: ['app', 'recipe', 'toolkit', 'workflow'],
        description: 'The consumer property kind (the one being granted access)',
      },
      consumer_ref: { type: 'string', description: 'The consumer property hash' },
      owner_kind: {
        type: 'string',
        enum: ['app', 'recipe', 'toolkit', 'workflow', 'human'],
        description: "The producer namespace kind. Use 'human' for your general knowledge.",
      },
      owner_ref: {
        type: 'string',
        description: "The producer property hash (required unless owner_kind is 'human')",
      },
      permission: {
        type: 'string',
        enum: ['read', 'read_write'],
        description: 'Granted permission (default: read)',
      },
      category_scope: {
        type: 'string',
        description: 'Optional: restrict the grant to a single category ref',
      },
    },
    required: ['consumer_kind', 'consumer_ref', 'owner_kind'],
  },
};

export async function handleGrantKbAccess(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const result = await client.createKbGrant({
      consumer_kind: String(args.consumer_kind) as 'app' | 'recipe' | 'toolkit' | 'workflow',
      consumer_ref: String(args.consumer_ref),
      owner_kind: String(args.owner_kind) as 'app' | 'recipe' | 'toolkit' | 'workflow' | 'human',
      owner_ref: args.owner_ref ? String(args.owner_ref) : undefined,
      permission: args.permission ? (String(args.permission) as 'read' | 'read_write') : undefined,
      category_scope: args.category_scope ? String(args.category_scope) : undefined,
      origin: 'standing_ui',
    });

    return {
      content: [
        { type: 'text', text: `Grant approved (id ${result.id}, permission ${result.permission}). It applies to YOUR data only.` },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error granting KB access: ${message}` }], isError: true };
  }
}
