/**
 * link_property_kb_source Tool
 *
 * Declare (or update by alias) a KB-source link on a consumer property you own.
 * Required scope: knowledge:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const linkPropertyKbSourceTool: Tool = {
  name: 'link_property_kb_source',
  description: `Declare a cross-property Knowledge-Base source link on a property you OWN (the consumer). This is the AUTHOR side of cross-property KB access.

**What this does (design-time):**
Maps an \`alias\` on the consumer property to a target KB namespace. The consumer's code then addresses that namespace by alias (e.g. an app reads \`window.kb.from('jobsearch').get(key)\`). The link carries NO user data and travels with the definition on clone/fork.

**CRITICAL — a link is NOT access.** It only declares intent. Each RUNNER must still consent (a **grant**) before any data is read, and every document read/written is that runner's OWN data in the target namespace. On interactive surfaces the consent is a modal; headless, it's a standing grant (see \`grant_kb_access\`).

**Ownership:** you can only declare links on a property you own (403 otherwise).

**Target kinds:** \`app\` | \`recipe\` | \`toolkit\` | \`workflow\` (give \`target_owner_ref\`), or \`human\` (the runner's own general knowledge — omit \`target_owner_ref\`).

\`\`\`json
{
  "consumer_kind": "app", "consumer_ref": "APP_HASH",
  "target_owner_kind": "recipe", "target_owner_ref": "RECIPE_HASH",
  "alias": "jobsearch", "default_permission": "read_write"
}
\`\`\`

Re-using an existing alias UPDATES that link. Related: \`list_property_kb_links\`, \`unlink_property_kb_source\`, \`grant_kb_access\`.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      consumer_kind: {
        type: 'string',
        enum: ['app', 'recipe', 'toolkit', 'workflow'],
        description: 'The kind of property that owns the link (you must own it)',
      },
      consumer_ref: { type: 'string', description: 'The consumer property hash' },
      target_owner_kind: {
        type: 'string',
        enum: ['app', 'recipe', 'toolkit', 'workflow', 'human'],
        description: "Target namespace kind. Use 'human' for the runner's general knowledge.",
      },
      target_owner_ref: {
        type: 'string',
        description: "Target property hash (required unless target_owner_kind is 'human')",
      },
      alias: {
        type: 'string',
        description: 'The handle the consumer code uses (letters, digits, . _ -)',
      },
      default_permission: {
        type: 'string',
        enum: ['read', 'read_write'],
        description: 'What the consent modal asks for (default: read)',
      },
    },
    required: ['consumer_kind', 'consumer_ref', 'target_owner_kind', 'alias'],
  },
};

export async function handleLinkPropertyKbSource(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const result = await client.createPropertyKbLink({
      consumer_kind: String(args.consumer_kind) as 'app' | 'recipe' | 'toolkit' | 'workflow',
      consumer_ref: String(args.consumer_ref),
      target_owner_kind: String(args.target_owner_kind) as 'app' | 'recipe' | 'toolkit' | 'workflow' | 'human',
      target_owner_ref: args.target_owner_ref ? String(args.target_owner_ref) : undefined,
      alias: String(args.alias),
      default_permission: args.default_permission
        ? (String(args.default_permission) as 'read' | 'read_write')
        : undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: `KB-source link declared: alias **${result.alias}** (id ${result.id}).

A link is not access — each runner must still consent (a grant) before any data is read.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error declaring KB-source link: ${message}` }], isError: true };
  }
}
