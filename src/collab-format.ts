/**
 * Shared formatters for per-object collaboration metadata returned by the Hub
 * (is_owner, my_permission, owner, shared_by) on workflows/apps/recipes/toolkits/
 * custom-nodes. Used by the list + get tool handlers so an MCP agent understands
 * the ownership relationship: what it owns vs. what was shared with it, by whom,
 * and at what access level. See Docs/DevGuides/COLLABORATION.md.
 *
 * The param is intentionally loose so handlers can pass their (variously typed)
 * response items without each item type needing the optional fields declared.
 */
export interface CollabFields {
  is_owner?: boolean;
  my_permission?: 'owner' | 'editor' | 'viewer' | null;
  owner?: { name?: string; hash?: string } | null;
  shared_by?: { name?: string; hash?: string } | null;
}

/** Compact inline suffix for a single list row. Empty for owned items. */
export function collabSuffix(raw: unknown): string {
  const item = (raw ?? {}) as CollabFields;
  if (!item || item.is_owner || !item.my_permission || item.my_permission === 'owner') {
    return '';
  }
  const role = item.my_permission === 'editor' ? 'Editor' : 'Viewer';
  const by = item.shared_by?.name || item.owner?.name;
  return ` · 🔗 Shared (${role})${by ? ` by ${by}` : ''}`;
}

/** Multi-line ownership/collaboration block for a detail (get) view. */
export function collabDetail(raw: unknown): string {
  const item = (raw ?? {}) as CollabFields;
  if (!item) {
    return '';
  }
  if (item.is_owner) {
    return '**Ownership:** You own this item.\n';
  }
  if (item.my_permission && item.my_permission !== 'owner') {
    const role =
      item.my_permission === 'editor'
        ? 'Editor — you can view and edit it'
        : 'Viewer — you can view/run it only';
    const owner = item.owner?.name ? `, owned by ${item.owner.name}` : '';
    const by = item.shared_by?.name ? `, shared by ${item.shared_by.name}` : '';
    return (
      `**Collaboration:** Shared with you as **${role}**${owner}${by}.\n` +
      'This item belongs to its owner — it is not yours to delete or transfer.\n'
    );
  }
  return '';
}
