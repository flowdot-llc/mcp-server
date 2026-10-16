/**
 * Agent messages over a real MCP client/server pair (AGENT_MESSAGES.md A1, A18,
 * B4, B12). The process tree is a test seam: this test process stands in for the
 * MCP server and its parent for claude.exe. The store is a temp dir.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { AgentCommsHandle, DEFAULT_CONFIG, listUnread, setStoreDirForTests, type ProcSnapshot } from '@flowdot.ai/agent-comms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FlowDotApiClient } from './api-client.js';
import { setupAgentComms, type AgentCommsController } from './agent-comms.js';
import { registerTools, tools } from './tools/index.js';

let store: string;
let proj: string;
const peers: AgentCommsHandle[] = [];
const controllers: AgentCommsController[] = [];

const snapshot = async (): Promise<ProcSnapshot> =>
  new Map([
    [process.pid, { pid: process.pid, ppid: process.ppid, name: 'node.exe', startedAt: 1 }],
    [process.ppid, { pid: process.ppid, ppid: 1, name: 'claude.exe', startedAt: 4242 }],
  ]);

const fakeApi = { panicStatus: vi.fn(async () => ({ panicked: false, panicked_at: null })) } as unknown as FlowDotApiClient;

async function connect(clientName: string) {
  const server = new Server({ name: 'flowdot', version: '0' }, { capabilities: { tools: { listChanged: true }, resources: {} } });
  const comms = setupAgentComms(server, fakeApi, null, { snapshotAsync: snapshot });
  controllers.push(comms);
  registerTools(server, fakeApi, null, undefined, comms);
  const [c, s] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: clientName, version: '1' });
  const changed = vi.fn();
  client.setNotificationHandler(ToolListChangedNotificationSchema, changed);
  await Promise.all([server.connect(s), client.connect(c)]);
  return { client, changed };
}

async function until(fn: () => Promise<boolean> | boolean, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error('timed out');
}

beforeEach(() => {
  store = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ac-store-'));
  setStoreDirForTests(store);
  proj = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ac-proj-'));
  process.env.CLAUDE_PROJECT_DIR = proj;
});
afterEach(() => {
  for (const c of controllers.splice(0)) c.close();
  for (const h of peers.splice(0)) h.close();
  delete process.env.CLAUDE_PROJECT_DIR;
  setStoreDirForTests(null);
  fs.rmSync(store, { recursive: true, force: true });
  fs.rmSync(proj, { recursive: true, force: true });
});

describe('MCP agent messages', () => {
  it('the static tools array (manifest source) never contains the agent-message tools', () => {
    const names = tools.map((t) => t.name);
    for (const n of ['agent_peers', 'agent_messages_read', 'agent_message_send', 'agent_message_wait', 'agent_status_set']) {
      expect(names).not.toContain(n);
    }
  });

  it('a Claude Code client registers one agent, lists the tools after list_changed, and reads peers', async () => {
    const { client, changed } = await connect('claude-code');
    await until(() => changed.mock.calls.length > 0);
    const listed = (await client.listTools()).tools.map((t) => t.name);
    expect(listed).toContain('agent_peers');
    expect(listed).toContain('agent_message_send');

    const peer = AgentCommsHandle.register({ kind: 'cli-job', name: 'astra', cwd: proj }, { config: DEFAULT_CONFIG, autoHeartbeat: false })!;
    peers.push(peer);
    const res = await client.callTool({ name: 'agent_peers', arguments: {} });
    const text = (res.content as Array<{ text: string }>)[0]!.text;
    expect(text).toContain(peer.id);
    expect(res.isError).toBeFalsy();
  });

  it('without a supervisor a send is refused (B12) and nothing is written', async () => {
    const { client, changed } = await connect('claude-code');
    await until(() => changed.mock.calls.length > 0);
    const peer = AgentCommsHandle.register({ kind: 'cli-job', name: 'astra', cwd: proj }, { config: DEFAULT_CONFIG, autoHeartbeat: false })!;
    peers.push(peer);
    const res = await client.callTool({ name: 'agent_message_send', arguments: { to: peer.id, text: 'hi' } });
    expect(res.isError).toBe(true);
    expect((res.content as Array<{ text: string }>)[0]!.text).toMatch(/without the permission supervisor/);
    expect(listUnread(peer.id)).toHaveLength(0);
  });

  it('FlowDot’s own MCP hosts never register an agent', async () => {
    const { client } = await connect('flowdot-native');
    await new Promise((r) => setTimeout(r, 200));
    const listed = (await client.listTools()).tools.map((t) => t.name);
    expect(listed).not.toContain('agent_peers');
    const res = await client.callTool({ name: 'agent_peers', arguments: {} });
    expect(res.isError).toBe(true);
    const agentsDir = path.join(store, 'agents');
    expect(fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).length : 0).toBe(0);
  });
});
