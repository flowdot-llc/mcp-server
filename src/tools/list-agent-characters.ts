/**
 * list_agent_characters MCP Tool
 *
 * Lists the user's own agent characters (voice-call characters: voice/STT/LLM
 * config + persona). Each row carries a completeness badge so the agent can
 * tell the user which characters are ready to call vs. which still need
 * voice-config fields filled in.
 * Scope: agent_characters:read
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listAgentCharactersTool: Tool = {
  name: 'list_agent_characters',
  description:
    'List your agent characters (voice-call personas). Each row shows a completeness badge — ready to call (✅) vs. missing voice config (⚠️). Use get_agent_character for full detail and update_agent_character to fill in missing fields.',
  inputSchema: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Filter by name or personality prompt substring',
      },
      limit: {
        type: 'number',
        default: 50,
        description: 'Maximum results per page (1-100)',
      },
      page: {
        type: 'number',
        default: 1,
        description: 'Page number',
      },
    },
    required: [],
  },
};

export async function handleListAgentCharacters(
  api: FlowDotApiClient,
  args: { search?: string; limit?: number; page?: number },
): Promise<CallToolResult> {
  try {
    const result = await api.listAgentCharacters(args);
    const characters = Array.isArray(result?.data) ? result.data : [];

    if (characters.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No agent characters found. Use `create_agent_character` to make one.',
          },
        ],
      };
    }

    const lines = [
      `## Your Agent Characters`,
      ``,
      `Found ${result.total} character${result.total === 1 ? '' : 's'} (page ${result.current_page}/${result.last_page}).`,
      ``,
    ];

    for (const c of characters) {
      const badge = c.is_complete
        ? '✅ ready to call'
        : `⚠️ missing ${c.missing_fields.length} field${c.missing_fields.length === 1 ? '' : 's'}`;
      lines.push(`### ${c.name} — ${badge}`);
      lines.push(`- **ID:** ${c.id}${c.hash ? ` | **Hash:** ${c.hash}` : ''}`);
      if (c.voice_provider || c.voice_id) {
        lines.push(`- **Voice:** ${c.voice_provider ?? '—'} / ${c.voice_id ?? '—'}${c.voice_name ? ` (${c.voice_name})` : ''}`);
      }
      if (c.llm_provider || c.llm_model) {
        lines.push(`- **LLM:** ${c.llm_provider ?? '—'} / ${c.llm_model ?? '—'}`);
      }
      if (!c.is_complete) {
        lines.push(`- **Missing:** ${c.missing_fields.join(', ')}`);
      }
      lines.push(`- **Public:** ${c.is_public ? 'yes' : 'no'} | **Forks:** ${c.fork_count}`);
      lines.push(``);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing agent characters: ${message}` }],
      isError: true,
    };
  }
}
