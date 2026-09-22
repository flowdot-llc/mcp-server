/**
 * Typed decision tools (Docs/DevGuides/JEV.md §2/§9, Amendment A10).
 *
 * The four canonical tools over the shared @flowdot.ai/api client (no second HTTP client, no LLM
 * resolver). `execute_decision` is the execute-and-wait adapter: the shared client preflights the
 * consented execute/read/cancel bundle BEFORE submission, persists nothing here (the caller supplies
 * the idempotency key), and polls within its deadline. Results are the DecisionCall object as
 * structuredContent (plus a JSON text copy); every refusal is a typed isError result carrying only
 * safe fields — never state, questions, answers or credentials in an error.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  DecisionApiError, DecisionPendingError, DecisionCancellationPendingError, DecisionCancelledError,
  DECISION_TOOLS, dispatchDecisionTool, type DecisionToolName,
} from '@flowdot.ai/api';
import type { FlowDotApiClient } from '../api-client.js';

export const DECISION_TOOL_NAMES: readonly string[] = DECISION_TOOLS;

export const executeDecisionTool: Tool = {
  name: 'execute_decision',
  description:
    'Run a typed Jev decision (noul yes/no, choice, score) and wait for the result. SPENDS the user\'s credits '
    + '(or their TypeSafe key with funding "byok"). Generate idempotency_key ONCE and reuse it to recover a pending or '
    + 'failed-transport call; a new key is a new billed call. Returns the DecisionCall.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      schema_version: { type: 'integer', enum: [1], description: 'Always 1.' },
      idempotency_key: { type: 'string', description: 'UUID you generate once per decision and reuse on retry.' },
      model: { type: 'string', description: 'Concrete model from list_decision_models, e.g. jev-1.13.0.' },
      funding: { type: 'string', enum: ['auto', 'byok', 'credits'], description: 'auto (default) prefers the user\'s key, else credits.' },
      state: { description: 'What to decide about: text, a JSON object or an array. Never null.' },
      questions: {
        type: 'object',
        description: '1–32 named questions. Keys and choice labels match [A-Za-z][A-Za-z0-9_]{0,63}. '
          + 'noul: {type:"noul", instructions?, criteria?:{true?,false?}}; '
          + 'choice: {type:"choice", instructions?, criteria:{label: description|null} (2–255)}; '
          + 'score: {type:"score", instructions?, criteria:[description|null, ...] (2–10 levels)}.',
      },
    },
    required: ['schema_version', 'idempotency_key', 'model', 'state', 'questions'],
  },
};

export const getDecisionTool: Tool = {
  name: 'get_decision',
  description: 'Read one of your decision calls by call_id (status, settlement, answers when available). Never creates work.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { call_id: { type: 'string', description: 'The decision call UUID.' } },
    required: ['call_id'],
  },
};

export const cancelDecisionTool: Tool = {
  name: 'cancel_decision',
  description: 'Request cancellation of one of your decision calls. Best-effort once dispatched; a finished call is only acknowledged.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { call_id: { type: 'string', description: 'The decision call UUID.' } },
    required: ['call_id'],
  },
};

export const listDecisionModelsTool: Tool = {
  name: 'list_decision_models',
  description: 'List decision models with primitives, limits, price per million input tokens, availability and whether this connection may execute/read/cancel.',
  inputSchema: { type: 'object', additionalProperties: false, properties: {} },
};

export const decisionTools: Tool[] = [executeDecisionTool, getDecisionTool, cancelDecisionTool, listDecisionModelsTool];

function success(data: object): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data as Record<string, unknown> };
}

/** Typed refusal. Only safe fields; the message never echoes inputs or server bodies. */
export function decisionToolError(error: unknown): CallToolResult {
  const e = error instanceof DecisionApiError ? error : new DecisionApiError('transport_error');
  const detail: Record<string, unknown> = { code: e.code, status: e.status, call_id: e.call_id, safe_to_retry: e.safe_to_retry };
  if (e.retry_after_ms !== undefined) detail.retry_after_ms = e.retry_after_ms;
  if (e instanceof DecisionPendingError || e instanceof DecisionCancellationPendingError || e instanceof DecisionCancelledError) {
    detail.idempotency_key = e.idempotency_key;
  }
  const payload = { error: detail };
  return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload, isError: true };
}

/** Argument checks and the call itself are the shared client's, so every surface accepts the same input. */
async function run(api: FlowDotApiClient, tool: DecisionToolName, args: unknown, signal?: AbortSignal): Promise<CallToolResult> {
  try {
    return success(await dispatchDecisionTool(api, tool, args, signal ? { signal } : {}));
  } catch (error) {
    return decisionToolError(error);
  }
}

export function handleExecuteDecision(api: FlowDotApiClient, args: unknown, signal?: AbortSignal): Promise<CallToolResult> {
  return run(api, 'execute_decision', args, signal);
}

export function handleGetDecision(api: FlowDotApiClient, args: unknown, signal?: AbortSignal): Promise<CallToolResult> {
  return run(api, 'get_decision', args, signal);
}

export function handleCancelDecision(api: FlowDotApiClient, args: unknown, signal?: AbortSignal): Promise<CallToolResult> {
  return run(api, 'cancel_decision', args, signal);
}

export function handleListDecisionModels(api: FlowDotApiClient, args: unknown, signal?: AbortSignal): Promise<CallToolResult> {
  return run(api, 'list_decision_models', args, signal);
}
