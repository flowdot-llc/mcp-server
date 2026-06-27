import { describe, it, expect, vi } from 'vitest';
import type { FlowDotApiClient } from '../api-client.js';
import { listPropertyKbLinksTool, handleListPropertyKbLinks } from './list-property-kb-links.js';
import { linkPropertyKbSourceTool, handleLinkPropertyKbSource } from './link-property-kb-source.js';
import { unlinkPropertyKbSourceTool, handleUnlinkPropertyKbSource } from './unlink-property-kb-source.js';
import { listKbGrantsTool, handleListKbGrants } from './list-kb-grants.js';
import { grantKbAccessTool, handleGrantKbAccess } from './grant-kb-access.js';
import { revokeKbAccessTool, handleRevokeKbAccess } from './revoke-kb-access.js';

describe('property KB tool definitions', () => {
  it('export the expected tool names', () => {
    expect(listPropertyKbLinksTool.name).toBe('list_property_kb_links');
    expect(linkPropertyKbSourceTool.name).toBe('link_property_kb_source');
    expect(unlinkPropertyKbSourceTool.name).toBe('unlink_property_kb_source');
    expect(listKbGrantsTool.name).toBe('list_kb_grants');
    expect(grantKbAccessTool.name).toBe('grant_kb_access');
    expect(revokeKbAccessTool.name).toBe('revoke_kb_access');
  });

  it('declare required fields', () => {
    expect(linkPropertyKbSourceTool.inputSchema.required).toEqual(
      expect.arrayContaining(['consumer_kind', 'consumer_ref', 'target_owner_kind', 'alias'])
    );
    expect(grantKbAccessTool.inputSchema.required).toEqual(
      expect.arrayContaining(['consumer_kind', 'consumer_ref', 'owner_kind'])
    );
    expect(unlinkPropertyKbSourceTool.inputSchema.required).toEqual(['link_id']);
    expect(revokeKbAccessTool.inputSchema.required).toEqual(['grant_id']);
  });
});

describe('list_property_kb_links', () => {
  it('calls the client with kind + ref and renders links', async () => {
    const api = {
      listPropertyKbLinks: vi.fn().mockResolvedValue([
        { id: 1, alias: 'prod', target: { kind: 'recipe', ref: 'r1', name: 'Recipe One' }, default_permission: 'read_write' },
      ]),
    } as unknown as FlowDotApiClient;

    const result = await handleListPropertyKbLinks(api, { consumer_kind: 'app', consumer_ref: 'a1' });

    expect(api.listPropertyKbLinks).toHaveBeenCalledWith('app', 'a1');
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('prod');
    expect(result.content[0].text).toContain('Recipe One');
  });

  it('renders an empty-state message', async () => {
    const api = { listPropertyKbLinks: vi.fn().mockResolvedValue([]) } as unknown as FlowDotApiClient;
    const result = await handleListPropertyKbLinks(api, { consumer_kind: 'app', consumer_ref: 'a1' });
    expect(result.content[0].text).toContain('No KB-source links');
  });

  it('returns isError on failure', async () => {
    const api = { listPropertyKbLinks: vi.fn().mockRejectedValue(new Error('boom')) } as unknown as FlowDotApiClient;
    const result = await handleListPropertyKbLinks(api, { consumer_kind: 'app', consumer_ref: 'a1' });
    expect(result.isError).toBe(true);
  });
});

describe('link_property_kb_source', () => {
  it('passes the full payload through to the client', async () => {
    const api = {
      createPropertyKbLink: vi.fn().mockResolvedValue({ id: 9, alias: 'prod' }),
    } as unknown as FlowDotApiClient;

    const result = await handleLinkPropertyKbSource(api, {
      consumer_kind: 'app',
      consumer_ref: 'a1',
      target_owner_kind: 'recipe',
      target_owner_ref: 'r1',
      alias: 'prod',
      default_permission: 'read_write',
    });

    expect(api.createPropertyKbLink).toHaveBeenCalledWith({
      consumer_kind: 'app',
      consumer_ref: 'a1',
      target_owner_kind: 'recipe',
      target_owner_ref: 'r1',
      alias: 'prod',
      default_permission: 'read_write',
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('not access');
  });

  it("omits target_owner_ref for the 'human' target", async () => {
    const api = {
      createPropertyKbLink: vi.fn().mockResolvedValue({ id: 1, alias: 'mine' }),
    } as unknown as FlowDotApiClient;

    await handleLinkPropertyKbSource(api, {
      consumer_kind: 'app',
      consumer_ref: 'a1',
      target_owner_kind: 'human',
      alias: 'mine',
    });

    expect(api.createPropertyKbLink).toHaveBeenCalledWith(
      expect.objectContaining({ target_owner_kind: 'human', target_owner_ref: undefined })
    );
  });

  it('returns isError on failure (e.g. 403 not owner)', async () => {
    const api = {
      createPropertyKbLink: vi.fn().mockRejectedValue(new Error('You can only manage knowledge sources for a app you own.')),
    } as unknown as FlowDotApiClient;
    const result = await handleLinkPropertyKbSource(api, {
      consumer_kind: 'app',
      consumer_ref: 'a1',
      target_owner_kind: 'recipe',
      target_owner_ref: 'r1',
      alias: 'prod',
    });
    expect(result.isError).toBe(true);
  });
});

describe('unlink_property_kb_source', () => {
  it('deletes by numeric id', async () => {
    const api = { deletePropertyKbLink: vi.fn().mockResolvedValue({ deleted: true }) } as unknown as FlowDotApiClient;
    const result = await handleUnlinkPropertyKbSource(api, { link_id: 7 });
    expect(api.deletePropertyKbLink).toHaveBeenCalledWith(7);
    expect(result.isError).toBeFalsy();
  });
});

describe('list_kb_grants', () => {
  it('renders the viewer grants', async () => {
    const api = {
      listKbGrants: vi.fn().mockResolvedValue([
        { id: 3, consumer: { kind: 'app', ref: 'a1', name: 'App' }, owner: { kind: 'recipe', ref: 'r1', name: 'R' }, permission: 'read', category_scope: null, origin: 'standing_ui', createdAt: null },
      ]),
    } as unknown as FlowDotApiClient;
    const result = await handleListKbGrants(api, {});
    expect(result.content[0].text).toContain('id 3');
  });

  it('renders empty state', async () => {
    const api = { listKbGrants: vi.fn().mockResolvedValue([]) } as unknown as FlowDotApiClient;
    const result = await handleListKbGrants(api, {});
    expect(result.content[0].text).toContain('no active');
  });
});

describe('grant_kb_access', () => {
  it('forces origin standing_ui and passes the payload', async () => {
    const api = { createKbGrant: vi.fn().mockResolvedValue({ id: 4, permission: 'read_write' }) } as unknown as FlowDotApiClient;
    const result = await handleGrantKbAccess(api, {
      consumer_kind: 'app',
      consumer_ref: 'a1',
      owner_kind: 'recipe',
      owner_ref: 'r1',
      permission: 'read_write',
    });
    expect(api.createKbGrant).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'standing_ui', owner_ref: 'r1', permission: 'read_write' })
    );
    expect(result.content[0].text).toContain('YOUR data only');
  });

  it('returns isError on failure', async () => {
    const api = { createKbGrant: vi.fn().mockRejectedValue(new Error('Producer namespace not found.')) } as unknown as FlowDotApiClient;
    const result = await handleGrantKbAccess(api, { consumer_kind: 'app', consumer_ref: 'a1', owner_kind: 'recipe', owner_ref: 'bad' });
    expect(result.isError).toBe(true);
  });
});

describe('revoke_kb_access', () => {
  it('revokes by numeric id', async () => {
    const api = { revokeKbGrant: vi.fn().mockResolvedValue({ revoked: true }) } as unknown as FlowDotApiClient;
    const result = await handleRevokeKbAccess(api, { grant_id: 4 });
    expect(api.revokeKbGrant).toHaveBeenCalledWith(4);
    expect(result.content[0].text).toContain('revoked');
  });

  it('reports when nothing was revoked', async () => {
    const api = { revokeKbGrant: vi.fn().mockResolvedValue({ revoked: false }) } as unknown as FlowDotApiClient;
    const result = await handleRevokeKbAccess(api, { grant_id: 999 });
    expect(result.content[0].text).toContain('No active grant');
  });
});
