/**
 * get_agent_character MCP Tool
 *
 * Get full detail on an agent character, including a per-field
 * Completeness section showing exactly which fields are still missing.
 * Use this to confirm a character is ready before starting a voice call.
 * Scope: agent_characters:read
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getAgentCharacterTool: Tool = {
  name: 'get_agent_character',
  description:
    'Get full detail on an agent character including its voice/STT/LLM config and a per-field Completeness section. Use this to confirm a character is ready to call.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Numeric character id (as a string)',
      },
    },
    required: ['id'],
  },
};

const REQUIRED_FIELDS: Array<{ column: string; metadata: string; label: string }> = [
  { column: 'voice_provider',     metadata: 'audio_provider',    label: 'Voice provider' },
  { column: 'voice_id',           metadata: 'voice_id',          label: 'Voice ID' },
  { column: 'tts_model',          metadata: 'tts_model',         label: 'TTS model' },
  { column: 'voice_settings',     metadata: 'voice_settings',    label: 'Voice settings' },
  { column: 'stt_provider',       metadata: 'stt_provider',      label: 'STT provider' },
  { column: 'stt_model',          metadata: 'stt_model',         label: 'STT model' },
  { column: 'llm_provider',       metadata: 'llm_provider',      label: 'LLM provider' },
  { column: 'llm_model',          metadata: 'llm_model',         label: 'LLM model' },
  { column: 'llm_temperature',    metadata: 'llm_temperature',   label: 'LLM temperature' },
  { column: 'personality_prompt', metadata: 'character_prompt',  label: 'Personality prompt' },
];

export async function handleGetAgentCharacter(
  api: FlowDotApiClient,
  args: { id: number | string },
): Promise<CallToolResult> {
  try {
    const c = await api.getAgentCharacter(args.id);
    const missing = new Set(c.missing_fields);

    const lines = [
      `## ${c.name}${c.is_complete ? ' — ✅ ready to call' : ` — ⚠️ ${c.missing_fields.length} field${c.missing_fields.length === 1 ? '' : 's'} missing`}`,
      ``,
      `**ID:** ${c.id}${c.hash ? ` | **Hash:** ${c.hash}` : ''}`,
      `**Public:** ${c.is_public ? 'yes' : 'no'} | **Forks:** ${c.fork_count}`,
      `**Created:** ${c.created_at} | **Updated:** ${c.updated_at}`,
      ``,
      `### Completeness`,
    ];
    for (const f of REQUIRED_FIELDS) {
      const isMissing = missing.has(f.metadata);
      const value = (c as unknown as Record<string, unknown>)[f.column];
      const display = isMissing
        ? '— (not set)'
        : f.column === 'voice_settings'
          ? `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
          : f.column === 'personality_prompt'
            ? typeof value === 'string' && value.length > 80
              ? `${(value as string).slice(0, 80).replace(/\n/g, ' ')}…`
              : String(value)
            : String(value);
      lines.push(`- ${isMissing ? '⚠️' : '✅'} **${f.label}:** ${display}`);
    }

    if (!c.is_complete) {
      lines.push(``);
      lines.push(`> **Next:** call \`update_agent_character\` with the missing field(s) — see \`learn://characters\` for recommended values per provider.`);
    }

    if (c.is_complete && typeof (c as { personality_prompt?: string | null }).personality_prompt === 'string' && (c as { personality_prompt: string }).personality_prompt.length > 80) {
      lines.push(``);
      lines.push(`### Personality prompt (full)`);
      lines.push((c as { personality_prompt: string }).personality_prompt);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting agent character: ${message}` }],
      isError: true,
    };
  }
}
