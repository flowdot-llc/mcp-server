/**
 * audit_property MCP tool handler tests.
 *
 * A thin markdown formatter over FlowDotApiClient.auditProperty. End-to-end
 * (auth/scope/canView/redaction) is covered by the Hub Pest suite at
 * tests/Feature/Api/McpPropertyAuditTest.php.
 */

import { describe, it, expect, vi } from 'vitest';
import type { FlowDotApiClient } from '../api-client.js';
import { auditPropertyTool, handleAuditProperty } from './audit-property.js';

function makeMockApi(overrides: Partial<FlowDotApiClient> = {}): FlowDotApiClient {
  return overrides as unknown as FlowDotApiClient;
}

const sampleAudit = {
  identity: {
    type: 'agent_toolkit',
    hash: 'tk1',
    name: 'Schwab',
    owner: { hash: 'ownerHash', name: 'Ann', avatar: null },
  },
  provenance: { chain: [{ name: 'Schwab', is_current: true }], counts: { copy_count: 3 } },
  scan: {
    scan_version: 1,
    capability_tags: ['network', 'credentials'],
    network: [{ host: 'api.schwab.com', method: 'GET', source: 'tool:get_quote', via: 'http' }],
    knowledge_base: [],
    llm: [],
    toolkits: [],
    credentials: [{ key: 'api_key', type: 'api_key', required: true, source: 'toolkit' }],
    external_effects: [],
    files: [],
    structure: {},
    linked: [],
    gaps: ['a templated URL could not be resolved'],
    notes: [],
  },
  computed_at: '2026-06-26T00:00:00Z',
  social_target: { content_type: 'agent_toolkit', id: 'tk1' },
};

describe('audit_property tool', () => {
  it('is named audit_property and requires type + hash', () => {
    expect(auditPropertyTool.name).toBe('audit_property');
    expect(auditPropertyTool.inputSchema.required).toEqual(['type', 'hash']);
  });

  it('formats the audit with capabilities, hosts, credentials, gaps, and author', async () => {
    const api = makeMockApi({ auditProperty: vi.fn().mockResolvedValue(sampleAudit) });

    const result = await handleAuditProperty(api, { type: 'agent_toolkit', hash: 'tk1' });
    const text = (result.content[0] as { text: string }).text;

    expect(result.isError).toBeFalsy();
    expect(api.auditProperty).toHaveBeenCalledWith('agent_toolkit', 'tk1');
    expect(text).toContain('network, credentials');
    expect(text).toContain('api.schwab.com');
    expect(text).toContain('api_key');
    expect(text).toContain('templated URL could not be resolved');
    expect(text).toContain('/users/ownerHash');
  });

  it('returns an error result when the audit call fails', async () => {
    const api = makeMockApi({ auditProperty: vi.fn().mockRejectedValue(new Error('Access denied')) });

    const result = await handleAuditProperty(api, { type: 'workflow', hash: 'x' });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Access denied');
  });
});
