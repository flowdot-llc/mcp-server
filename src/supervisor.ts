/**
 * MCP-side supervisor: wraps every tool call in the @flowdot-llc/guardian-agent
 * runtime so we get a hash-chained audit log + in-process emergency stop.
 *
 * The supervisor is OPTIONAL — `createSupervisor` returns null when:
 *   - the env var FLOWDOT_SUPERVISOR is set to "off"
 *   - or `options.enable === false`
 *
 * This keeps the MCP server runnable in environments where audit logging is
 * undesirable (transient CI shells, ephemeral containers without persistent
 * volume) without forcing a fork.
 *
 * Audit log destination resolution order (first non-empty wins):
 *   1. options.auditDir
 *   2. env FLOWDOT_AUDIT_DIR
 *   3. <homedir>/.flowdot/audit
 */

import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { KeyObject } from 'node:crypto';

import {
  AuditLogWriter,
  EStopLocal,
  GuardianHaltedError,
  GuardianRuntime,
  type AuditRecord,
} from '@flowdot-llc/guardian-agent';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { loadOrCreateAuditKey } from './audit-keys.js';
import { RateLimiter } from './rate-limiter.js';
import { redactArgs } from './redaction.js';

export interface SupervisorOptions {
  /** Audit log directory. Overrides FLOWDOT_AUDIT_DIR and the default. */
  auditDir?: string;
  /** Audit log file name (default 'mcp.jsonl'). */
  auditFile?: string;
  /** Agent id stamped on every record (default 'mcp-server'). */
  agentId?: string;
  /** Pre-generated session id; default is timestamp-derived. */
  sessionId?: string;
  /** Set false to disable supervisor entirely. */
  enable?: boolean;
  /**
   * Pre-supplied audit-signing private key (testing). When omitted, we
   * loadOrCreateAuditKey() from ~/.flowdot/keys/audit.key. Pass `false`
   * explicitly to disable signing.
   */
  signWith?: KeyObject | false;
  /** Optional override for the audit-key directory (testing). */
  keyDir?: string;
  /**
   * Max sustained tool calls per second before rate-limiting kicks in.
   * Default 50. Set to 0 to disable rate-limiting entirely.
   */
  maxCallsPerSecond?: number;
}

export interface Supervisor {
  readonly audit: AuditLogWriter;
  readonly runtime: GuardianRuntime;
  readonly estop: EStopLocal;
  readonly auditPath: string;
  /** Absolute path to the public key (for verification with guardian-verify). */
  readonly publicKeyPath: string | null;
  /** Rate-limiter consulted on every tool call. Null when disabled. */
  readonly rateLimiter: RateLimiter | null;
  /**
   * If true, suppress further `x_rate_limit_breached` events until the next
   * allowed call lands. We don't want the audit log itself to flood when a
   * caller is hammering us.
   */
  rateBreachActive: boolean;
  /** Idempotent close: emits session_close, flushes audit log. */
  close(): Promise<void>;
}

/**
 * Create the MCP supervisor. Returns null when disabled via env or options.
 */
export async function createSupervisor(
  options: SupervisorOptions = {},
): Promise<Supervisor | null> {
  if (options.enable === false) return null;
  if (process.env.FLOWDOT_SUPERVISOR === 'off') return null;

  const auditDir =
    options.auditDir ??
    process.env.FLOWDOT_AUDIT_DIR ??
    join(homedir(), '.flowdot', 'audit');

  if (!existsSync(auditDir)) {
    mkdirSync(auditDir, { recursive: true, mode: 0o700 });
  }

  const auditPath = join(auditDir, options.auditFile ?? 'mcp.jsonl');
  const agentId = options.agentId ?? 'mcp-server';
  const sessionId = options.sessionId ?? 'sess_' + sessionIdFromTimestamp();

  // Resolve signing key: explicit `false` disables; pre-supplied KeyObject
  // wins; otherwise load-or-create.
  let signWith: KeyObject | undefined;
  let publicKeyPath: string | null = null;
  if (options.signWith === false) {
    signWith = undefined;
  } else if (options.signWith) {
    signWith = options.signWith;
  } else {
    const keyPair = loadOrCreateAuditKey(
      options.keyDir === undefined ? {} : { keyDir: options.keyDir },
    );
    signWith = keyPair.privateKey;
    publicKeyPath = keyPair.paths.publicKeyPath;
  }

  // Deferred recovery state: if onTipRecovered fires with anything other
  // than session_close, we record an x_session_recovered after the runtime
  // emits its session_open.
  let recoveryRecord: AuditRecord | null = null;

  const audit = new AuditLogWriter({
    path: auditPath,
    agentId,
    sessionId,
    ...(signWith === undefined ? {} : { signWith }),
    onTipRecovered: (last) => {
      if (last.kind !== 'session_close') {
        recoveryRecord = last;
      }
    },
  });
  const estop = new EStopLocal({ audit });
  const runtime = new GuardianRuntime({
    agentId,
    sessionId,
    audit,
    estop,
  });

  await runtime.openSession();

  // After session_open lands, write the recovery event if applicable.
  if (recoveryRecord !== null) {
    await audit.append({
      // Extension event per SPEC §10 conformance ("MAY add x_-prefixed kinds").
      kind: 'x_session_recovered' as unknown as 'session_open',
      status: 'approved',
      initiator: 'system',
      detail: {
        prior_session_id: (recoveryRecord as AuditRecord).session_id,
        prior_event_id: (recoveryRecord as AuditRecord).event_id,
        prior_kind: (recoveryRecord as AuditRecord).kind,
      },
    });
  }

  // Rate limiter. maxCallsPerSecond=0 disables.
  const envRate = process.env.FLOWDOT_SUPERVISOR_RATE
    ? Number(process.env.FLOWDOT_SUPERVISOR_RATE)
    : undefined;
  const configuredRate = options.maxCallsPerSecond ?? envRate ?? 50;
  const rateLimiter =
    configuredRate > 0 ? new RateLimiter({ maxCallsPerSecond: configuredRate }) : null;

  return {
    audit,
    runtime,
    estop,
    auditPath,
    publicKeyPath,
    rateLimiter,
    rateBreachActive: false,
    async close(): Promise<void> {
      await runtime.close();
    },
  };
}

/**
 * Run a tool-dispatch function under the supervisor. Emits the tool_call /
 * policy_check / tool_result sequence; intercepts GuardianHaltedError and
 * surfaces it as an MCP isError response.
 *
 * Pipeline (in order):
 *   1. Rate-limit check (token bucket, default 50/sec). Single breach event
 *      emitted per burst; further denied calls in the same burst don't
 *      re-write the audit (avoid flood-on-flood).
 *   2. Initiator note: MCP-dispatched calls are inherently agent-initiated;
 *      `panic_clear` specifically gets a `detail.warning` so post-incident
 *      reconstruction shows the agent tried to clear the kill switch.
 *   3. Argument redaction: `tool.args` recorded in the audit log is the
 *      redacted copy; the dispatch function still receives the original.
 *   4. Halt check + audit lifecycle: handled by `runtime.tool(...)`.
 */
export async function runUnderSupervisor(
  supervisor: Supervisor,
  toolName: string,
  dispatch: () => Promise<CallToolResult>,
  rawArgs?: unknown,
): Promise<CallToolResult> {
  // 1. Rate-limit gate.
  if (supervisor.rateLimiter) {
    const consume = supervisor.rateLimiter.tryConsume();
    if (!consume.allowed) {
      // Emit one breach event per burst (flag flips back when a call
      // succeeds again).
      if (!supervisor.rateBreachActive) {
        supervisor.rateBreachActive = true;
        await supervisor.audit.append({
          kind: 'x_rate_limit_breached' as unknown as 'policy_check',
          status: 'denied',
          initiator: 'system',
          detail: {
            tool: toolName,
            retry_after_ms: consume.retryAfterMs,
          },
        });
      }
      return {
        content: [
          {
            type: 'text',
            text:
              `Rate limit exceeded for MCP tool dispatch. ` +
              `Retry in ~${consume.retryAfterMs}ms.`,
          },
        ],
        isError: true,
      };
    }
    // Successful consume — clear the breach flag so the next breach burst
    // will emit a fresh audit event.
    supervisor.rateBreachActive = false;
  }

  // 2/3. Redact args for the audit; dispatch sees originals.
  const redactedArgs = redactArgs(rawArgs);

  // 4. Wrap dispatch in `runtime.tool`. We attach a synthetic redacted
  // argument to the audit by intercepting the runtime's args-to-object
  // logic — the runtime records positional args from the wrapped function,
  // so we pass the redacted args as the single argument to the wrapper.
  const wrapped = supervisor.runtime.tool(
    // The wrapper's positional args become tool.args in the audit. Passing
    // the redacted args ONCE here records them; dispatch ignores them and
    // calls the actual handler closure.
    async (_redactedForAudit: unknown) => {
      // Add panic_clear warning to the audit BEFORE dispatch, so it shows
      // up adjacent to the tool_call event.
      if (toolName === 'panic_clear') {
        await supervisor.audit.append({
          kind: 'x_panic_clear_warning' as unknown as 'policy_check',
          status: 'approved',
          initiator: 'system',
          detail: {
            tool: toolName,
            warning:
              'agent-initiated panic_clear; Hub enforces password.confirm gate (SPEC §7 / PANIC.md §6).',
          },
        });
      }
      return dispatch();
    },
    { name: toolName },
  );
  try {
    return await wrapped(redactedArgs);
  } catch (err) {
    if (err instanceof GuardianHaltedError) {
      return {
        content: [
          {
            type: 'text',
            text:
              `Tool call refused: emergency stop is active.\n` +
              `Reason: ${err.reason ?? 'unspecified'}\n` +
              `Construct a new MCP server session to recover.`,
          },
        ],
        isError: true,
      };
    }
    throw err;
  }
}

function sessionIdFromTimestamp(): string {
  // Compact, sortable, no chars that need quoting on POSIX paths.
  return new Date().toISOString().replace(/[^0-9]/g, '');
}
