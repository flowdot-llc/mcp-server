/**
 * Browser tool tests for the MCP server: registration, validation, and the
 * graceful no-Playwright paths — WITHOUT launching a real browser. The engine /
 * host-guard behaviour itself is covered in @flowdot.ai/browser-driver.
 *
 * Critically: importing this module (and therefore tools/index.ts) must NOT
 * require Playwright — the server has to start with playwright absent. These tests
 * exercise that by driving the api-less handlers directly.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  browserTools,
  handleBrowserLaunch,
  handleBrowserAct,
  handleBrowserNavigate,
  handleBrowserFillForm,
  handleBrowserListSessions,
  handleBrowserClose,
  closeBrowserSessions,
} from './browser.js';
import { tools } from './index.js';

afterEach(async () => {
  await closeBrowserSessions();
});

function text(r: { content: Array<{ type: string; text?: string }>; isError?: boolean }): string {
  return r.content.map((c) => c.text ?? '').join('');
}

describe('MCP browser tools — registration', () => {
  it('exports 12 browser tool definitions', () => {
    expect(browserTools).toHaveLength(12);
    const names = browserTools.map((t) => t.name);
    expect(names).toContain('browser_launch');
    expect(names).toContain('browser_fill_form');
    expect(names).toContain('browser_list_sessions');
  });

  it('registers all browser tools in the central tools[] catalog', () => {
    const names = new Set((tools as Array<{ name: string }>).map((t) => t.name));
    for (const t of browserTools) expect(names.has(t.name), `${t.name} missing from tools[]`).toBe(true);
  });
});

describe('MCP browser tools — validation (no browser launched)', () => {
  it('browser_launch requires url or app_path', async () => {
    const r = await handleBrowserLaunch({});
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/url.*app_path|app_path.*url/i);
  });

  it('browser_act requires a session_id', async () => {
    const r = await handleBrowserAct({ action: 'click', target: 'x' });
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/session_id/i);
  });

  it('browser_navigate requires a url', async () => {
    const r = await handleBrowserNavigate({ session_id: 'abc12345' });
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/url is required/i);
  });

  it('browser_fill_form requires a non-empty fields array', async () => {
    const r = await handleBrowserFillForm({ session_id: 'abc12345', fields: [] });
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/non-empty array/i);
  });
});

describe('MCP browser tools — no-Playwright paths (server starts without playwright)', () => {
  it('browser_list_sessions returns an empty list on a fresh process', async () => {
    const r = await handleBrowserListSessions();
    expect(r.isError).toBeUndefined();
    expect(JSON.parse(text(r))).toEqual({ sessions: [] });
  });

  it('browser_act on an unknown session fails cleanly (no throw)', async () => {
    const r = await handleBrowserAct({ session_id: 'nope', action: 'click', target: 'x' });
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/session not found/i);
  });

  it('browser_close on an unknown session is idempotent', async () => {
    const r = await handleBrowserClose({ session_id: 'nope' });
    expect(r.isError).toBeUndefined();
    expect(JSON.parse(text(r))).toEqual({ closed: 'nope' });
  });
});
