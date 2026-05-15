/**
 * Per-tool capability tags for the mcp-server. SPEC §13.1 (v0.3.0+).
 *
 * Two layers:
 *  1. Exact-name overrides for tools whose semantics don't match a prefix.
 *  2. Prefix-pattern fallback (`list_*` → read, `create_*` → write, etc.).
 *
 * Layered on top: every mcp-server tool is Hub-backed, so `network-egress`
 * and `credential` are added to almost every entry. A flood of `list_*`
 * calls IS a credential + network-egress burst from the Hub's perspective
 * — capability rules should see that shape.
 *
 * The function is pure: same input → same output. No side effects.
 */

import type { CapabilityClass } from '@flowdot-llc/guardian-agent';

/**
 * Tools that don't fit any prefix pattern, or where the prefix is misleading.
 * Listed here first; prefix fallback runs only when there's no exact hit.
 */
const EXACT_OVERRIDES: Readonly<Record<string, readonly CapabilityClass[]>> = {
  // Identity / chat
  whoami: ['read', 'network-egress', 'credential'],
  agent_chat: ['execute', 'network-egress', 'credential'],

  // PANIC family — see SPEC §7 + Flow-Docs/DevGuides/PANIC.md
  panic_status: ['read'],
  panic_stop: ['execute', 'credential'],
  panic_clear: ['execute', 'credential'],

  // Email — external API + per-account credentials
  email_send: ['write', 'network-egress', 'credential'],
  email_reply: ['write', 'network-egress', 'credential'],
  email_draft: ['write', 'network-egress', 'credential'],
  email_archive: ['write', 'network-egress', 'credential'],
  email_label: ['write', 'network-egress', 'credential'],
  email_delete: ['delete', 'network-egress', 'credential'],
  email_list_threads: ['read', 'network-egress', 'credential'],
  email_search: ['read', 'network-egress', 'credential'],
  email_read: ['read', 'network-egress', 'credential'],

  // Search aggregate / KB / notifications
  search: ['read', 'network-egress', 'credential'],
  send_notification: ['write', 'network-egress', 'credential'],
  query_knowledge_base: ['read', 'network-egress', 'credential'],
};

/**
 * Ordered list of (verb-prefix, capability-set) tuples. First-match wins.
 * Order matters: `execute_` must precede a broader catch-all if any.
 */
const PREFIX_RULES: ReadonlyArray<readonly [string, readonly CapabilityClass[]]> = [
  // Destructive
  ['delete_', ['delete', 'network-egress', 'credential']],

  // Execute / orchestrate / validate
  ['execute_', ['execute', 'network-egress', 'credential']],
  ['cancel_', ['execute', 'network-egress', 'credential']],
  ['stream_', ['execute', 'network-egress', 'credential']],
  ['retry_', ['execute', 'network-egress', 'credential']],
  ['invoke_', ['execute', 'network-egress', 'credential']],
  ['emit_', ['execute', 'network-egress', 'credential']],
  ['test_', ['execute', 'network-egress', 'credential']],
  ['check_', ['execute', 'network-egress', 'credential']],
  ['validate_', ['read', 'network-egress', 'credential']],

  // Read-shaped
  ['list_', ['read', 'network-egress', 'credential']],
  ['get_', ['read', 'network-egress', 'credential']],
  ['search_', ['read', 'network-egress', 'credential']],
  ['browse_', ['read', 'network-egress', 'credential']],
  ['find_', ['read', 'network-egress', 'credential']],
  ['query_', ['read', 'network-egress', 'credential']],
  ['describe_', ['read', 'network-egress', 'credential']],

  // Write-shaped (broadest set: most verbs that mutate state)
  ['add_', ['write', 'network-egress', 'credential']],
  ['create_', ['write', 'network-egress', 'credential']],
  ['update_', ['write', 'network-egress', 'credential']],
  ['insert_', ['write', 'network-egress', 'credential']],
  ['append_', ['write', 'network-egress', 'credential']],
  ['prepend_', ['write', 'network-egress', 'credential']],
  ['patch_', ['write', 'network-egress', 'credential']],
  ['set_', ['write', 'network-egress', 'credential']],
  ['toggle_', ['write', 'network-egress', 'credential']],
  ['favorite_', ['write', 'network-egress', 'credential']],
  ['vote_', ['write', 'network-egress', 'credential']],
  ['link_', ['write', 'network-egress', 'credential']],
  ['unlink_', ['write', 'network-egress', 'credential']],
  ['move_', ['write', 'network-egress', 'credential']],
  ['transfer_', ['write', 'network-egress', 'credential']],
  ['publish_', ['write', 'network-egress', 'credential']],
  ['unpublish_', ['write', 'network-egress', 'credential']],
  ['reprocess_', ['write', 'network-egress', 'credential']],
  ['upload_', ['write', 'network-egress', 'credential']],
  ['clone_', ['write', 'network-egress', 'credential']],
  ['duplicate_', ['write', 'network-egress', 'credential']],
  ['fork_', ['write', 'network-egress', 'credential']],
  ['copy_', ['write', 'network-egress', 'credential']],
  ['complete_', ['write', 'network-egress', 'credential']],
  ['abandon_', ['write', 'network-egress', 'credential']],
  ['pause_', ['write', 'network-egress', 'credential']],
  ['resume_', ['write', 'network-egress', 'credential']],
  ['share_', ['write', 'network-egress', 'credential']],
  ['install_', ['write', 'network-egress', 'credential']],
  ['uninstall_', ['delete', 'network-egress', 'credential']],
  ['checkpoint_', ['write', 'network-egress', 'credential']],
  ['restore_', ['write', 'network-egress', 'credential']],
  ['rename_', ['write', 'network-egress', 'credential']],
  ['edit_', ['write', 'network-egress', 'credential']],
];

/**
 * Strip the `mcp__flowdot__` (or `mcp__<server>__`) prefix when present.
 * MCP tool names dispatched via the central switch can carry a doubled
 * namespace prefix for toolkit-via-MCP routing.
 */
function stripMcpPrefix(name: string): string {
  const idx = name.indexOf('mcp__');
  if (idx !== 0) return name;
  // mcp__<server>__<rest> — drop the first two `__`-separated segments.
  const parts = name.split('__');
  if (parts.length < 3) return name;
  return parts.slice(2).join('__');
}

/**
 * Resolve the capability set for an mcp-server tool name. Returns
 * `['unknown']` when no exact override + no prefix matches. The fallback
 * is intentional — capability rules don't match `unknown` unless explicitly
 * named, so unknown tools simply count toward the default rate bucket.
 */
export function capabilitiesFor(toolName: string): CapabilityClass[] {
  const stripped = stripMcpPrefix(toolName);
  // 1. Exact override (try both the raw and the stripped name).
  const exact = EXACT_OVERRIDES[toolName] ?? EXACT_OVERRIDES[stripped];
  if (exact) return [...exact];
  // 2. Prefix rule against the stripped name.
  for (const [prefix, caps] of PREFIX_RULES) {
    if (stripped.startsWith(prefix)) return [...caps];
  }
  // 3. Fallback.
  return ['unknown'];
}

/**
 * Visible for tests + introspection. Returns true iff the tool name has
 * any non-`unknown` mapping (either via exact override or prefix rule).
 */
export function isTagged(toolName: string): boolean {
  const caps = capabilitiesFor(toolName);
  return caps.length !== 1 || caps[0] !== 'unknown';
}
