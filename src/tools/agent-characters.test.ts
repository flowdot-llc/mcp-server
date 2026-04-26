/**
 * Agent Character MCP tool handler tests.
 *
 * Each tool here is a thin formatter on top of FlowDotApiClient — these
 * tests pin the markdown output shape and the error path. End-to-end
 * (through to the Hub + AgentCharacterCompleteness validator) is covered
 * by the Hub Pest suite at tests/Feature/Api/McpAgentCharactersTest.php.
 *
 * @license
 * Copyright 2026 FlowDot
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import type { FlowDotApiClient } from '../api-client.js';
import {
  handleListAgentCharacters,
  listAgentCharactersTool,
} from './list-agent-characters.js';
import {
  handleGetAgentCharacter,
  getAgentCharacterTool,
} from './get-agent-character.js';
import {
  handleCreateAgentCharacter,
  createAgentCharacterTool,
} from './create-agent-character.js';
import {
  handleUpdateAgentCharacter,
  updateAgentCharacterTool,
} from './update-agent-character.js';
import {
  handleDeleteAgentCharacter,
  deleteAgentCharacterTool,
} from './delete-agent-character.js';
import {
  handleForkAgentCharacter,
  forkAgentCharacterTool,
} from './fork-agent-character.js';
import {
  handleDuplicateAgentCharacter,
  duplicateAgentCharacterTool,
} from './duplicate-agent-character.js';
import {
  handleToggleAgentCharacterPublic,
  toggleAgentCharacterPublicTool,
} from './toggle-agent-character-public.js';

const completeCharacter = {
  id: 11,
  hash: null,
  name: 'Test Harness',
  avatar: null,
  voice_provider: 'fish-audio',
  voice_id: 'voice_test',
  voice_name: null,
  tts_model: 's1',
  voice_settings: { temperature: 0.7, top_p: 0.9, latency: 'normal', chunk_length: 200 },
  stt_provider: 'openai',
  stt_model: 'whisper-1',
  llm_provider: 'openai',
  llm_model: 'gpt-4o-mini',
  llm_temperature: 0.6,
  personality_prompt: 'A complete test character.',
  is_public: false,
  traits: [] as string[],
  forked_from_id: null,
  fork_count: 0,
  is_complete: true,
  missing_fields: [] as string[],
  created_at: '2026-04-25T12:00:00Z',
  updated_at: '2026-04-25T12:00:00Z',
};

const incompleteCharacter = {
  ...completeCharacter,
  id: 12,
  name: 'Half-Baked',
  voice_id: null,
  tts_model: null,
  is_complete: false,
  missing_fields: ['voice_id', 'tts_model'],
};

function makeMockApi(overrides: Partial<FlowDotApiClient> = {}): FlowDotApiClient {
  return overrides as unknown as FlowDotApiClient;
}

describe('Agent Character tool definitions', () => {
  it.each([
    ['list_agent_characters', listAgentCharactersTool],
    ['get_agent_character', getAgentCharacterTool],
    ['create_agent_character', createAgentCharacterTool],
    ['update_agent_character', updateAgentCharacterTool],
    ['delete_agent_character', deleteAgentCharacterTool],
    ['fork_agent_character', forkAgentCharacterTool],
    ['duplicate_agent_character', duplicateAgentCharacterTool],
    ['toggle_agent_character_public', toggleAgentCharacterPublicTool],
  ] as const)('exposes %s as the tool name', (name, tool) => {
    expect(tool.name).toBe(name);
  });
});

describe('handleListAgentCharacters', () => {
  it('renders an empty-state message when no characters', async () => {
    const api = makeMockApi({
      listAgentCharacters: vi.fn().mockResolvedValue({
        data: [],
        current_page: 1,
        per_page: 50,
        total: 0,
        last_page: 1,
      }),
    });

    const result = await handleListAgentCharacters(api, {});

    expect(result.isError).toBeFalsy();
    expect((result.content[0] as { text: string }).text).toContain('No agent characters');
  });

  it('marks complete characters with ✅ and incomplete with ⚠️', async () => {
    const api = makeMockApi({
      listAgentCharacters: vi.fn().mockResolvedValue({
        data: [completeCharacter, incompleteCharacter],
        current_page: 1,
        per_page: 50,
        total: 2,
        last_page: 1,
      }),
    });

    const text = (await handleListAgentCharacters(api, {})).content[0] as { text: string };

    expect(text.text).toContain('Test Harness');
    expect(text.text).toContain('✅ ready to call');
    expect(text.text).toContain('Half-Baked');
    expect(text.text).toContain('⚠️ missing 2 fields');
    expect(text.text).toContain('voice_id, tts_model');
  });

  it('forwards search/limit/page to the API', async () => {
    const listFn = vi.fn().mockResolvedValue({ data: [], current_page: 2, per_page: 5, total: 0, last_page: 1 });
    const api = makeMockApi({ listAgentCharacters: listFn });

    await handleListAgentCharacters(api, { search: 'harness', limit: 5, page: 2 });

    expect(listFn).toHaveBeenCalledWith({ search: 'harness', limit: 5, page: 2 });
  });

  it('returns isError on api exception', async () => {
    const api = makeMockApi({
      listAgentCharacters: vi.fn().mockRejectedValue(new Error('boom')),
    });

    const result = await handleListAgentCharacters(api, {});

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('boom');
  });
});

describe('handleGetAgentCharacter', () => {
  it('shows ✅ Completeness section for a complete character', async () => {
    const api = makeMockApi({
      getAgentCharacter: vi.fn().mockResolvedValue(completeCharacter),
    });

    const text = (await handleGetAgentCharacter(api, { id: '11' })).content[0] as { text: string };

    expect(text.text).toContain('Test Harness');
    expect(text.text).toContain('ready to call');
    expect(text.text).toContain('### Completeness');
    expect(text.text).not.toContain('— (not set)');
  });

  it('marks each missing field with ⚠️ and surfaces the next-step hint', async () => {
    const api = makeMockApi({
      getAgentCharacter: vi.fn().mockResolvedValue(incompleteCharacter),
    });

    const text = (await handleGetAgentCharacter(api, { id: '12' })).content[0] as { text: string };

    expect(text.text).toContain('⚠️ **Voice ID:** — (not set)');
    expect(text.text).toContain('⚠️ **TTS model:** — (not set)');
    expect(text.text).toContain('update_agent_character');
  });
});

describe('handleCreateAgentCharacter', () => {
  it('passes the input through to api.createAgentCharacter', async () => {
    const createFn = vi.fn().mockResolvedValue(completeCharacter);
    const api = makeMockApi({ createAgentCharacter: createFn });

    const input = {
      name: 'X',
      voice_provider: 'fish-audio',
      voice_id: 'v',
      tts_model: 's1',
      voice_settings: { temperature: 0.5, top_p: 0.9, latency: 'normal', chunk_length: 200 },
      stt_provider: 'openai',
      stt_model: 'whisper-1',
      llm_provider: 'openai',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.6,
      personality_prompt: 'p',
    };

    await handleCreateAgentCharacter(api, input);

    expect(createFn).toHaveBeenCalledWith(input);
  });

  it('surfaces 422 incomplete-config errors verbatim', async () => {
    const api = makeMockApi({
      createAgentCharacter: vi.fn().mockRejectedValue(
        new Error(
          'Character is missing required voice config fields. Edit and save every required field before creating. | detail: voice_id, tts_model',
        ),
      ),
    });

    const result = await handleCreateAgentCharacter(api, { name: 'X' } as never);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('missing required voice config');
  });
});

describe('handleUpdateAgentCharacter', () => {
  it('strips id from the body before forwarding to api.updateAgentCharacter', async () => {
    const updateFn = vi.fn().mockResolvedValue(completeCharacter);
    const api = makeMockApi({ updateAgentCharacter: updateFn });

    await handleUpdateAgentCharacter(api, { id: '11', voice_id: 'voice_new' } as never);

    expect(updateFn).toHaveBeenCalledWith('11', { voice_id: 'voice_new' });
  });

  it('reports remaining missing fields when the post-merge state is still incomplete', async () => {
    const api = makeMockApi({
      updateAgentCharacter: vi.fn().mockResolvedValue(incompleteCharacter),
    });

    const text = (await handleUpdateAgentCharacter(api, { id: '12', name: 'Half-Baked' } as never)).content[0] as { text: string };
    expect(text.text).toContain('Still missing: voice_id, tts_model');
  });
});

describe('handleDeleteAgentCharacter', () => {
  it('refuses to call the API without confirm:true', async () => {
    const deleteFn = vi.fn();
    const api = makeMockApi({ deleteAgentCharacter: deleteFn });

    const result = await handleDeleteAgentCharacter(api, { id: '11', confirm: false });
    expect(result.isError).toBe(true);
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('calls deleteAgentCharacter when confirm:true', async () => {
    const api = makeMockApi({
      deleteAgentCharacter: vi.fn().mockResolvedValue({ deleted: true, id: 11 }),
    });

    const result = await handleDeleteAgentCharacter(api, { id: '11', confirm: true });
    expect(result.isError).toBeFalsy();
    expect((result.content[0] as { text: string }).text).toContain('Deleted');
  });
});

describe('handleForkAgentCharacter', () => {
  it('hits api.forkAgentCharacter with the source hash', async () => {
    const forkFn = vi.fn().mockResolvedValue({
      ...completeCharacter,
      id: 99,
      llm_provider: 'default',
      llm_model: 'default',
      is_complete: false,
      missing_fields: ['llm_provider', 'llm_model', 'llm_temperature'],
    });
    const api = makeMockApi({ forkAgentCharacter: forkFn });

    const result = await handleForkAgentCharacter(api, { hash: 'aabbccdd' });

    expect(forkFn).toHaveBeenCalledWith('aabbccdd');
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Forked');
    expect(text).toContain('LLM (reset)');
    expect(text).toContain('Pick your LLM');
  });
});

describe('handleDuplicateAgentCharacter', () => {
  it('hits api.duplicateAgentCharacter with the source id', async () => {
    const dupFn = vi.fn().mockResolvedValue({ ...completeCharacter, id: 22, name: 'Test Harness (Copy)' });
    const api = makeMockApi({ duplicateAgentCharacter: dupFn });

    const result = await handleDuplicateAgentCharacter(api, { id: '11' });

    expect(dupFn).toHaveBeenCalledWith('11');
    expect((result.content[0] as { text: string }).text).toContain('Test Harness (Copy)');
  });
});

describe('handleToggleAgentCharacterPublic', () => {
  it('reports the new visibility + hash', async () => {
    const api = makeMockApi({
      toggleAgentCharacterPublic: vi.fn().mockResolvedValue({
        ...completeCharacter,
        id: 11,
        is_public: true,
        hash: 'mintedhash',
      }),
    });

    const text = (await handleToggleAgentCharacterPublic(api, { id: '11' })).content[0] as { text: string };
    expect(text.text).toContain('Published');
    expect(text.text).toContain('mintedhash');
  });
});
