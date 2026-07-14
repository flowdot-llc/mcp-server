/**
 * interactive-cli — OPT-IN interactive-CLI QA tools for the published FlowDot MCP
 * server (TERMINAL_EYES.md Part E). Registered ONLY when `FLOWDOT_CLI_QA=1`, so the
 * default install of `@flowdot.ai/mcp-server` gains no process-spawning surface and
 * never pays for node-pty.
 *
 * The engine + EYES transport come from `@flowdot.ai/cli-qa-engine` (inlined into
 * dist/vendor at build). node-pty is NOT a dependency of this package — it is
 * lazy-required from the LAUNCH CWD when the flag is on (a plain import.meta.url
 * resolve lands in the isolated npx cache and fails), so a CLI-QA user runs the
 * server from a directory where `node-pty` is installed. Sessions auto-register on
 * 127.0.0.1:3847 → they appear in the flowdot-native Terminal Eyes panel.
 */
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { InteractiveCliEngine, EyesTransport, type SpawnPtyFn } from '@flowdot.ai/cli-qa-engine';

export const CLI_QA_ENABLED = process.env.FLOWDOT_CLI_QA === '1' || process.env.FLOWDOT_CLI_QA === 'true';

// FlowDot's DEDICATED eyes port (must match flowdot-native's eyesService). NOT 3847 —
// that is the legacy interactive-cli-mcp fleet's port. This keeps flowdot MCP CLI-QA
// sessions on the same private network as the native app's Terminal Eyes panel.
const FLOWDOT_EYES_PORT = Number(process.env.FLOWDOT_EYES_PORT) || 3849;

let engine: InteractiveCliEngine | null = null;
let transport: EyesTransport | null = null;
let initError: string | null = null;

function loadSpawnPty(): SpawnPtyFn {
  const req = createRequire(pathToFileURL(join(process.cwd(), 'noop.js')));
  const pty = req('node-pty') as { spawn: (shell: string, args: string[], opts: unknown) => unknown };
  return (shell, args, opts) =>
    pty.spawn(shell, args, { name: opts.name, cols: opts.cols, rows: opts.rows, cwd: opts.cwd, env: opts.env }) as never;
}

function ensureEngine(): InteractiveCliEngine {
  if (engine) return engine;
  if (initError) throw new Error(initError);
  try {
    const spawnPty = loadSpawnPty();
    transport = new EyesTransport({ instanceId: randomUUID(), pid: process.pid, port: FLOWDOT_EYES_PORT, cwd: process.cwd(), log: (m) => console.error(m) });
    engine = new InteractiveCliEngine({
      spawnPty,
      sink: {
        sessionStart: (id, cmd, cwd) => transport!.onSessionStart(id, cmd, cwd),
        output: (id, d) => transport!.onOutput(id, d),
        input: (id, d) => transport!.onInput(id, d),
        sessionEnd: (id, code) => transport!.onSessionEnd(id, code),
      },
      makeId: () => randomUUID(),
    });
    transport.start();
    return engine;
  } catch (err) {
    initError = `Interactive CLI QA needs node-pty. Install it in the directory you launch the server from (npm i node-pty), then set FLOWDOT_CLI_QA=1. (${err instanceof Error ? err.message : String(err)})`;
    throw new Error(initError);
  }
}

export function shutdownInteractiveCli(): void {
  try {
    engine?.killAll();
  } catch {
    /* noop */
  }
  try {
    transport?.stop();
  } catch {
    /* noop */
  }
}

if (CLI_QA_ENABLED) {
  process.on('exit', shutdownInteractiveCli);
}

const S = (name: string, description: string, properties: Record<string, object>, required: string[] = []): Tool => ({
  name,
  description,
  inputSchema: { type: 'object', properties, required },
});

export const INTERACTIVE_CLI_TOOLS: Tool[] = [
  S('interactive_cli__start_session', 'Launch an interactive CLI program in a real terminal (PTY) for QA — you drive it and the operator watches live in the FlowDot native Terminal Eyes panel. Returns a session_id.', {
    command: { type: 'string', description: 'The command to run (e.g. "flowdot architect \'add a comment\'")' },
    cwd: { type: 'string', description: 'Working directory (optional)' },
    cols: { type: 'number', description: 'Terminal columns (default 120)' },
    rows: { type: 'number', description: 'Terminal rows (default 30)' },
  }, ['command']),
  S('interactive_cli__read_output', 'Read accumulated output (compressed). Use from_index for lossless incremental reads.', {
    session_id: { type: 'string' },
    from_index: { type: 'number', description: '0 = all since start (optional)' },
    compress_animations: { type: 'boolean', description: 'default true' },
  }, ['session_id']),
  S('interactive_cli__send_input', 'Type text into the running program (answer a prompt).', {
    session_id: { type: 'string' },
    input: { type: 'string' },
    press_enter: { type: 'boolean', description: 'append Enter (default false)' },
  }, ['session_id', 'input']),
  S('interactive_cli__wait_for_pattern', 'Wait until a regex or preset appears. Presets: prompt, shell_prompt, thinking, complete, error, permission, question.', {
    session_id: { type: 'string' },
    pattern: { type: 'string' },
    preset: { type: 'string', enum: ['prompt', 'shell_prompt', 'thinking', 'complete', 'error', 'permission', 'question'] },
    timeout_ms: { type: 'number' },
  }, ['session_id']),
  S('interactive_cli__wait_for_idle', 'Wait until output goes quiet (app finished responding).', {
    session_id: { type: 'string' },
    idle_ms: { type: 'number' },
    timeout_ms: { type: 'number' },
    ignore_spinners: { type: 'boolean' },
  }, ['session_id']),
  S('interactive_cli__wait_for_exit', 'Wait until the process exits; returns the exit code.', {
    session_id: { type: 'string' },
    timeout_ms: { type: 'number' },
  }, ['session_id']),
  S('interactive_cli__get_screen_snapshot', 'What is on screen right now (compressed).', {
    session_id: { type: 'string' },
    max_lines: { type: 'number' },
    include_raw: { type: 'boolean' },
  }, ['session_id']),
  S('interactive_cli__get_status', 'Is the session still running + its exit code.', { session_id: { type: 'string' } }, ['session_id']),
  S('interactive_cli__list_sessions', 'List your active CLI sessions.', {}),
  S('interactive_cli__close_session', 'Close/kill a session.', {
    session_id: { type: 'string' },
    force: { type: 'boolean' },
  }, ['session_id']),
  S('interactive_cli__run_test_sequence', 'One-shot QA: start → wait ready → send a message → wait for the response → close. Returns a structured summary.', {
    command: { type: 'string' },
    cwd: { type: 'string' },
    input_message: { type: 'string' },
    ready_idle_ms: { type: 'number' },
    response_idle_ms: { type: 'number' },
    timeout_ms: { type: 'number' },
    close_after: { type: 'boolean' },
  }, ['command', 'input_message']),
];

const INTERACTIVE_CLI_NAMES = new Set(INTERACTIVE_CLI_TOOLS.map((t) => t.name));

export function isInteractiveCliToolName(name: string): boolean {
  return INTERACTIVE_CLI_NAMES.has(name);
}

/** The tools active for THIS process (empty unless FLOWDOT_CLI_QA is set). */
export function activeInteractiveCliTools(): Tool[] {
  return CLI_QA_ENABLED ? INTERACTIVE_CLI_TOOLS : [];
}

function ok(result: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

export async function dispatchInteractiveCli(name: string, args: unknown): Promise<CallToolResult> {
  if (!CLI_QA_ENABLED) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: 'Interactive CLI QA is disabled. Set FLOWDOT_CLI_QA=1 to enable.' }) }], isError: true };
  }
  try {
    const e = ensureEngine();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = (args ?? {}) as any;
    switch (name) {
      case 'interactive_cli__start_session': return ok(e.startSession(a));
      case 'interactive_cli__read_output': return ok(e.readOutput(a));
      case 'interactive_cli__send_input': return ok(await e.sendInput(a));
      case 'interactive_cli__wait_for_pattern': return ok(await e.waitForPattern(a));
      case 'interactive_cli__wait_for_idle': return ok(await e.waitForIdle(a));
      case 'interactive_cli__wait_for_exit': return ok(await e.waitForExit(a));
      case 'interactive_cli__get_screen_snapshot': return ok(e.getScreenSnapshot(a));
      case 'interactive_cli__get_status': return ok(e.getStatus(a));
      case 'interactive_cli__list_sessions': return ok(e.listSessions());
      case 'interactive_cli__close_session': return ok(e.closeSession(a));
      case 'interactive_cli__run_test_sequence': return ok(await e.runTestSequence(a));
      default: return { content: [{ type: 'text', text: JSON.stringify({ error: `Unknown interactive CLI tool: ${name}` }) }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) }], isError: true };
  }
}
