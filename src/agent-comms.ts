/**
 * Agent messages on the MCP server — how a Claude Code session takes part
 * (Docs/DevGuides/AGENT_MESSAGES.md A1, A18, B4, B9, B12, C4, C8).
 *
 * - Registers the Claude Code session ONCE, after `initialize`, keyed by the
 *   Claude process (several FlowDot MCP servers under one Claude = one agent).
 *   Never registers for FlowDot's own MCP hosts (flowdot-native / flowdot-cli)
 *   and never when this package is imported as a library (only startServer
 *   calls setupAgentComms).
 * - The five tools are added ONLY in ListTools/CallTool (never the static
 *   `tools` array), so the Hub manifest, the parity test and the desktop app's
 *   in-process platform tools are unchanged. Only the primary server lists them;
 *   every server accepts calls to them.
 * - Gate: a no-op dispatch under this server's supervisor (audit + E-stop + rate
 *   limit); the message text is audited as length + sha256 only. The human
 *   permission prompt is Claude Code's own MCP tool permission.
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import {
  AGENT_COMMS_TOOL_DEFS,
  ClaudeSession,
  dispatchAgentCommsTool,
  isAgentCommsTool,
  loadConfig,
  processSnapshotAsync,
  type PanicState,
  type ProcSnapshot,
} from '@flowdot.ai/agent-comms';
import type { FlowDotApiClient } from './api-client.js';
import { runUnderSupervisor, type Supervisor } from './supervisor.js';

export { isAgentCommsTool };

export interface AgentCommsController {
  /** Tools to append to tools/list (empty unless this server is the session's primary). */
  listTools(): Tool[];
  handles(name: string): boolean;
  call(name: string, args: unknown, signal?: AbortSignal): Promise<CallToolResult>;
  close(): void;
}

class GateRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyRefusalError';
  }
}

const PANIC_TTL_MS = 5_000;

export interface AgentCommsTestSeams {
  snapshotAsync?: () => Promise<ProcSnapshot | null>;
  selfPid?: number;
}

export function setupAgentComms(
  server: Server,
  api: FlowDotApiClient,
  supervisor: Supervisor | null,
  seams: AgentCommsTestSeams = {},
): AgentCommsController {
  let session: ClaudeSession | null = null;
  let closed = false;
  let panicCache: { at: number; state: PanicState } = { at: 0, state: 'unknown' };

  const refreshPanic = async (): Promise<void> => {
    if (Date.now() - panicCache.at < PANIC_TTL_MS) return;
    try {
      const s = await api.panicStatus();
      panicCache = { at: Date.now(), state: s.panicked ? 'engaged' : 'clear' };
    } catch {
      panicCache = { at: Date.now(), state: 'unknown' };
    }
  };
  const panicState = (): PanicState => {
    if (supervisor?.estop.isPressed()) return 'engaged';
    return panicCache.state;
  };

  const resolveFolder = async (): Promise<{ folder: string; source: 'CLAUDE_PROJECT_DIR' | 'roots' | 'cwd' }> => {
    const env = process.env.CLAUDE_PROJECT_DIR;
    if (env && env.trim()) return { folder: env, source: 'CLAUDE_PROJECT_DIR' };
    try {
      if (server.getClientCapabilities()?.roots) {
        const { roots } = await server.listRoots();
        const first = roots.find((r) => r.uri.startsWith('file:'));
        if (first) return { folder: fileURLToPath(first.uri), source: 'roots' };
      }
    } catch {
      /* fall through */
    }
    return { folder: process.cwd(), source: 'cwd' };
  };

  const start = async (): Promise<void> => {
    try {
      const clientName = server.getClientVersion()?.name;
      const cfg = loadConfig();
      if (!cfg.enabled) return;
      const [snap, where] = await Promise.all([(seams.snapshotAsync ?? processSnapshotAsync)(), resolveFolder(), refreshPanic()]);
      if (closed || !snap) return;
      session = ClaudeSession.start({
        clientName,
        folder: where.folder,
        folderSource: where.source,
        config: cfg,
        snapshot: () => snap,
        ...(seams.selfPid ? { selfPid: seams.selfPid } : {}),
        panicState,
        hasSupervisor: () => supervisor !== null,
        onPrimaryChange: () => {
          void server.sendToolListChanged().catch(() => undefined);
        },
      });
      if (session) console.error(`Agent messages: registered as ${session.id} (${where.source}).`);
    } catch (err) {
      console.error('Agent messages: not started —', err instanceof Error ? err.message : String(err));
    }
  };

  const prev = server.oninitialized;
  server.oninitialized = () => {
    prev?.();
    void start();
  };

  const close = (): void => {
    if (closed) return;
    closed = true;
    session?.close();
  };
  process.once('exit', close);
  process.stdin.once('end', close);
  process.stdin.once('close', close);

  return {
    listTools(): Tool[] {
      if (!session?.isPrimary) return [];
      return AGENT_COMMS_TOOL_DEFS.map((d) => ({ name: d.name, description: d.description, inputSchema: d.inputSchema as Tool['inputSchema'] }));
    },
    handles: (name) => isAgentCommsTool(name),
    async call(name, args, signal): Promise<CallToolResult> {
      if (!isAgentCommsTool(name)) return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
      if (!session) {
        return {
          content: [{ type: 'text', text: 'Agent messages are unavailable here: this server is not running under a Claude Code session, or agent messages are turned off.' }],
          isError: true,
        };
      }
      await refreshPanic();
      const s = session;
      try {
        const out = await dispatchAgentCommsTool(s, name, args, {
          signal,
          waitChunkSeconds: s.cfg.mcpWaitChunkSeconds,
          gate: async (call) => {
            if (!supervisor) return; // reads allowed; sends refuse via hasSupervisor (B12)
            const res = await runUnderSupervisor(
              supervisor,
              call.tool,
              async () => ({ content: [{ type: 'text', text: 'gate passed' }] }),
              call.auditArgs,
              undefined,
              [call.policy === 'agent.comms.send' ? 'write' : 'read'],
            );
            if (res.isError) {
              const text = res.content.map((c) => ('text' in c ? c.text : '')).join(' ');
              throw new GateRefusal(text || 'refused by the supervisor');
            }
          },
          auditStatus: (ev) => {
            void supervisor?.audit
              .append({ kind: 'x_agent_comms_op' as unknown as 'policy_check', status: 'ok', initiator: 'system', detail: { op: ev.tool, ok: ev.ok, ...(ev.error ? { error: ev.error } : {}) } } as never)
              .catch(() => undefined);
          },
        });
        return { content: [{ type: 'text', text: out.text }], ...(out.success ? {} : { isError: true }) };
      } catch (err) {
        return { content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }], isError: true };
      }
    },
    close,
  };
}
