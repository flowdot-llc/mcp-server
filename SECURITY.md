# Security model — `@flowdot.ai/mcp-server`

This document describes what the supervisor layer **does** defend against, what it **does not**, and where the trust boundaries sit. Read it before deploying in any environment where MCP tool calls touch sensitive systems.

## What the supervisor is

When started, the FlowDot MCP server constructs a `Supervisor` (see `src/supervisor.ts`) holding three primitives from `@flowdot-llc/guardian-agent`:

- **`AuditLogWriter`** — appends hash-chained, ed25519-signed JSON-Lines records for every tool call. Default path `~/.flowdot/audit/mcp.jsonl`.
- **`EStopLocal`** — in-process halt flag. Pressed via `SIGUSR2` or the in-process API. Subsequent tool calls return `isError: true` with the reason.
- **`GuardianRuntime`** — wraps every MCP `CallToolRequest`, applying:
  1. Rate-limit gate (default 50 calls/sec; configurable).
  2. Argument redaction in the audit record (originals still flow to the dispatch).
  3. Halt check.
  4. Audit lifecycle (`tool_call` → `policy_check` → `tool_result`).

Every step is recorded. The audit log + ed25519 signatures + hash chain give you a tamper-evident record of everything the MCP server did, sufficient for post-incident reconstruction by an operator who holds the public key.

## Threat model

### What the supervisor defends against

| # | Threat | Defense |
|---|---|---|
| 1 | An MCP client (typically an LLM agent) invokes a tool the operator did not authorize | Every call is recorded; the Hub-side panic system halts outbound operations user-wide |
| 2 | An attacker rewrites past audit records to cover tracks | ed25519-signed hash chain; verification under the public key detects any modification |
| 3 | Audit log destination is filled with bogus entries to obscure real activity | Single `x_rate_limit_breached` event per burst; rate-limiter caps sustained throughput |
| 4 | Sensitive arguments (passwords, tokens, JWTs) land in the audit log | Pattern-based redaction in `src/redaction.ts` strips known-sensitive keys and token-shaped string values |
| 5 | An unclean shutdown leaves the operator unsure whether the prior session ended normally | `x_session_recovered` extension event written on next start, with prior session id + last event id |
| 6 | An attacker spuriously triggers the local kill switch to disrupt operations | `SIGUSR2` requires shell access to the host; if the host is already compromised the supervisor is too (see "What it does NOT defend against" below) |
| 7 | An LLM agent attempts to clear the system-wide PANIC | `x_panic_clear_warning` audit event marks the attempt; Hub-side `password.confirm` middleware (per `Flow-Docs/DevGuides/PANIC.md` §6) is the load-bearing rejection |

### What the supervisor does NOT defend against

| Limitation | Rationale |
|---|---|
| **A fully compromised runtime process** | Per `guardian-agent` SPEC §8: the supervisor lives in the same memory space as the dispatch. A code-execution attacker can read the audit-signing private key, press/clear the local estop, and write arbitrary audit records. Worker-process isolation is a future v1.x project. |
| **A compromised audit signing key** | An attacker who reads `~/.flowdot/keys/audit.key` can forge signed audit entries indistinguishable from real ones. Protect the key file (Linux/Mac: `0o600`; Windows: restricted-permission location). |
| **Hub-side compromise** | When the Hub is compromised, `api.*` calls into the Hub return whatever the attacker chooses; the MCP server cannot detect this from inside the call. The audit log records that calls were made, not whether their results were truthful. |
| **Protocol-level operator authentication** | MCP has no operator-vs-agent distinction at the protocol layer. The supervisor records every MCP-dispatched call as `initiator: agent` and adds an `x_panic_clear_warning` when sensitive operations flow through. The Hub-side `password.confirm` gate is the actual operator-authentication layer. |
| **Cross-platform signals** | Windows doesn't honor POSIX signals; `process.on('SIGUSR2')` is a no-op there. On Windows, restart the server or call `supervisor.estop.press` from embedding code. |

## File-system surface

| Path | Purpose | Default mode |
|---|---|---|
| `~/.flowdot/audit/mcp.jsonl` | Hash-chained signed audit log | `0o600` |
| `~/.flowdot/keys/audit.key` | ed25519 PRIVATE key (sign audit records) | `0o600` |
| `~/.flowdot/keys/audit.pub.pem` | ed25519 PUBLIC key (verify audit records) | `0o644` |

Overridable via env:
- `FLOWDOT_AUDIT_DIR` — replace `~/.flowdot/audit`.
- `FLOWDOT_AUDIT_KEY_DIR` — replace `~/.flowdot/keys`.
- `FLOWDOT_SUPERVISOR=off` — disable the supervisor entirely (audit log + estop + signing all skipped).
- `FLOWDOT_SUPERVISOR_RATE=<n>` — override the rate-limit threshold; `0` disables rate limiting.

## Operator workflow

### Verify the audit log

After running the server, verify the integrity of any audit log with the public key:

```bash
node node_modules/@flowdot-llc/guardian-agent/dist/cli/guardian-verify.js \
  ~/.flowdot/audit/mcp.jsonl \
  --pubkey ~/.flowdot/keys/audit.pub.pem
```

Output:
- `chain ok ; signatures ok` → log is intact.
- Anything else → the log has been tampered with, truncated, or signed with a different key.

### Press the local emergency stop

```bash
kill -SIGUSR2 $(pgrep -f flowdot-mcp)
```

Subsequent tool calls return `isError: emergency stop is active`. Per the `guardian-agent` SPEC §5.3, recovery requires constructing a new server instance (i.e., restarting the MCP server).

### Press the system-wide PANIC

Use the `panic_stop` MCP tool with `confirm: true`, or any FlowDot surface (Web TopBar, Native sidebar, Mobile drawer). The Hub coordinates the kill across every surface; subsequent outbound calls return HTTP 423 Locked until cleared. See `Flow-Docs/DevGuides/PANIC.md` for the full architecture.

The two stop buttons compose:
- **Local `EStopLocal`**: halts this MCP server's tool dispatch even if the Hub is unreachable.
- **Hub `PANIC`**: halts outbound activity for the user across every surface, including this MCP server's Hub-bound calls.

## Disclosure

Report security issues privately to: **security@flowdot.ai**

We aim to acknowledge within 48 hours and ship a fix or mitigation within 30 days, depending on severity. Coordinate disclosure timing in your initial report.

## Pre-alpha status

This MCP server is pre-alpha. The supervisor itself ships at 100% test coverage on the touched library code (see `guardian-agent-ts/tests/`), but is not yet hardened against:

- Worker-process compromise of the supervisor itself.
- Schema-driven redaction (current redaction is pattern-based).
- Distributed audit-log coordination across multiple servers sharing one user.

These are tracked in `Flow-Docs/GUARDIAN_AGENT.md` and the upstream SPEC §8 open questions.
