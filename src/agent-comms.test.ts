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

async function connect(clientName: string, api: FlowDotApiClient = fakeApi) {
  const server = new Server({ name: 'flowdot', version: '0' }, { capabilities: { tools: { listChanged: true }, resources: {} } });
  const comms = setupAgentComms(server, api, null, { snapshotAsync: snapshot });
  controllers.push(comms);
  registerTools(server, api, null, undefined, comms);
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

  // Panic check (bug 2026-10-16: every send refused "panic state is unknown (offline)").
  const throwingApi = (message: string) =>
    ({ panicStatus: vi.fn(async () => { throw new Error(message); }) }) as unknown as FlowDotApiClient;
  const sendText = async (client: Client, to: string) => {
    const res = await client.callTool({ name: 'agent_message_send', arguments: { to, text: 'hi' } });
    return { isError: res.isError, text: (res.content as Array<{ text: string }>)[0]!.text };
  };
  const registerPeer = () => {
    const peer = AgentCommsHandle.register({ kind: 'cli-job', name: 'astra', cwd: proj }, { config: DEFAULT_CONFIG, autoHeartbeat: false })!;
    peers.push(peer);
    return peer;
  };
  /** Stand in for a second FlowDot server of the same Claude session (a live pid: this test's parent). */
  const writeOtherLease = (lease: Record<string, unknown>) => {
    const agents = path.join(store, 'agents');
    const hosts = fs.readdirSync(agents).find((f) => f.endsWith('.hosts'))!;
    fs.writeFileSync(path.join(agents, hosts, `${process.ppid}.json`), JSON.stringify({ v: 1, pid: process.ppid, heartbeatAt: Date.now(), ...lease }));
  };

  it('a Hub that cannot be reached refuses the send with the real reason, not "offline"', async () => {
    const { client, changed } = await connect('claude-code', throwingApi('fetch failed'));
    await until(() => changed.mock.calls.length > 0);
    const out = await sendText(client, registerPeer().id);
    expect(out.isError).toBe(true);
    expect(out.text).toMatch(/panic state could not be checked \(the Hub panic check failed: fetch failed\)/);
    expect(out.text).not.toMatch(/offline/);
  });

  it('when the only server’s token is rejected, the send is refused and says so', async () => {
    const { client, changed } = await connect('claude-code', throwingApi('Unauthorized - Token not found'));
    await until(() => changed.mock.calls.length > 0);
    const out = await sendText(client, registerPeer().id);
    expect(out.text).toMatch(/no FlowDot server in this Claude session has a working token \(the Hub rejected this server's token: Unauthorized - Token not found\)/);
  });

  it('another server of the session with a rejected token does not block a clear account', async () => {
    const { client, changed } = await connect('claude-code');
    await until(() => changed.mock.calls.length > 0);
    const peer = registerPeer();
    writeOtherLease({ panic: 'unknown', noAccount: true, panicDetail: "the Hub rejected this server's token: Unauthorized - Token not found" });
    const out = await sendText(client, peer.id);
    // Past the panic gate: the next refusal is the missing supervisor (B12).
    expect(out.text).toMatch(/without the permission supervisor/);
  });

  it('another server of the session whose check failed for any other reason still blocks, with its reason', async () => {
    const { client, changed } = await connect('claude-code');
    await until(() => changed.mock.calls.length > 0);
    const peer = registerPeer();
    writeOtherLease({ panic: 'unknown', panicDetail: 'the Hub panic check failed: API error: 503' });
    const out = await sendText(client, peer.id);
    expect(out.text).toMatch(/could not be checked \(the Hub panic check failed: API error: 503\)/);
    writeOtherLease({ panic: 'engaged' });
    expect((await sendText(client, peer.id)).text).toMatch(/panic is engaged/);
  });

  it('a comms call made right after initialize waits for registration instead of failing', async () => {
    const { client } = await connect('claude-code');
    const res = await client.callTool({ name: 'agent_peers', arguments: {} });
    expect(res.isError).toBeFalsy();
  });
});
