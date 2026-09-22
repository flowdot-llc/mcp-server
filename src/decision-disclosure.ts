/**
 * Per-connection disclosure for the typed decision tools (Docs/DevGuides/JEV.md Amendment A10).
 *
 * The stdio server lists every other tool as before; the four decision tools are omitted from
 * tools/list — and refused if called by name — until THIS connection reads the `learn://decisions`
 * resource (or one of its aliases). The unlock then emits notifications/tools/list_changed. The
 * generated manifest (`tools`) stays the complete static inventory; this is runtime filtering only,
 * and it never substitutes for the Hub's decision scopes and consent.
 */

import { getTopic } from '@flowdot.ai/platform-learn';
import { DECISION_TOOL_NAMES } from './tools/decisions.js';

export interface DecisionDisclosure {
  unlocked: boolean;
}

export function createDecisionDisclosure(): DecisionDisclosure {
  return { unlocked: false };
}

export function isDecisionTool(name: string): boolean {
  return DECISION_TOOL_NAMES.includes(name);
}

/** True when `uri` is the decisions learning resource under its canonical id or an alias. */
export function isDecisionLearnUri(uri: string): boolean {
  return uri.startsWith('learn://') && getTopic(uri.slice('learn://'.length))?.id === 'decisions';
}

export const DECISION_LOCKED_MESSAGE =
  'Decision tools are not enabled on this connection. Read the learn://decisions resource first; it explains cost, '
  + 'idempotency and consent, and enables execute_decision, get_decision, cancel_decision and list_decision_models.';
