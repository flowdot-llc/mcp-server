/**
 * duplicate_agent_character MCP Tool
 *
 * Duplicate one of the caller's own characters. Copies every field
 * including LLM choice (unlike fork). Name suffixed with " (Copy)".
 * Scope: agent_characters:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const duplicateAgentCharacterTool: Tool = {
  name: 'duplicate_agent_character',
  description:
    "Duplicate one of your own agent characters. Unlike fork, this copies the full LLM choice as well — useful for spinning up a variant.",
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Numeric id of the source character (as a string; must be yours)',
      },
    },
    required: ['id'],
  },
};

export async function handleDuplicateAgentCharacter(
  api: FlowDotApiClient,
  args: { id: number | string },
): Promise<CallToolResult> {
  try {
    const c = await api.duplicateAgentCharacter(args.id);
    const lines = [
      `## 📄 Duplicated agent character: ${c.name}`,
      ``,
      `**New ID:** ${c.id}`,
      `**Voice:** ${c.voice_provider ?? '—'} / ${c.voice_id ?? '—'}`,
      `**LLM:** ${c.llm_provider ?? '—'} / ${c.llm_model ?? '—'}`,
      ``,
      c.is_complete ? '> ✅ Ready to call.' : `> ⚠️ Still missing: ${c.missing_fields.join(', ')}`,
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error duplicating agent character: ${message}` }],
      isError: true,
    };
  }
}
