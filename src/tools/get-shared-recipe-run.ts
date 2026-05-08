/**
 * get_shared_recipe_run MCP Tool
 *
 * Fetches one published recipe run with its full per-step trace, model
 * lineup, token totals, current speculative cost, and final output stores.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getSharedRecipeRunTool: Tool = {
  name: 'get_shared_recipe_run',
  description:
    'Get full details of one published recipe run: per-step trace (model, tokens, duration, tool calls), total tokens, speculative cost from current model pricing, and the final output stores. Use this to compare runs in detail or read the actual answer a recipe produced.',
  inputSchema: {
    type: 'object',
    properties: {
      recipe_hash: { type: 'string', description: 'The recipe hash' },
      run_hash: { type: 'string', description: 'The published run hash (10 chars)' },
    },
    required: ['recipe_hash', 'run_hash'],
  },
};

export async function handleGetSharedRecipeRun(
  api: FlowDotApiClient,
  args: { recipe_hash: string; run_hash: string },
): Promise<CallToolResult> {
  try {
    const run = await api.getSharedRecipeRun(args.recipe_hash, args.run_hash) as any;

    const lines: string[] = [
      `## ${run.title || `Run ${run.hash}`}`,
      '',
      `**Hash:** ${run.hash}`,
      `**Status:** ${run.final_status}`,
      `**Public URL:** ${run.share_url}`,
      `**Recipe:** ${run.recipe?.title || run.recipe?.name || run.recipe?.hash}`,
      `**Stats:** ${run.totals?.tokens ?? 0} tokens (↑${run.totals?.input_tokens ?? 0} ↓${run.totals?.output_tokens ?? 0}) · ${run.totals?.duration_ms ?? 0}ms · ${run.totals?.tool_calls ?? 0} tool calls`,
      `**Views:** ${run.view_count} | **Votes:** ${run.vote_count}`,
      `**Created:** ${run.created_at}`,
    ];

    if (run.user) lines.push(`**Published by:** ${run.user.name}`);
    if (run.description) lines.push('', `**Description:** ${run.description}`);

    if (run.speculative_cost) {
      lines.push('', `**Speculative cost (at current pricing):** $${(run.speculative_cost.totals?.cost ?? 0).toFixed(6)}`);
      if (run.speculative_cost.any_unmatched) {
        lines.push('  _Some calls did not match a known model in the pricing cache._');
      }
    }

    if (Array.isArray(run.step_results) && run.step_results.length > 0) {
      lines.push('', `### Steps (${run.step_results.length})`);
      for (const step of run.step_results) {
        const tokens = (typeof step.inputTokensUsed === 'number' || typeof step.outputTokensUsed === 'number')
          ? ` · ↑${step.inputTokensUsed ?? 0} ↓${step.outputTokensUsed ?? 0}`
          : '';
        const model = step.model ? ` · ${step.provider ? step.provider + '/' : ''}${step.model}` : '';
        const tier = step.modelTier ? ` (${step.modelTier})` : '';
        lines.push(`- **${step.stepName || step.stepId}** [${step.stepType}] · ${step.status}${model}${tier}${tokens} · ${step.durationMs}ms · ${step.toolCallCount ?? 0} tools`);
        if (step.error) {
          lines.push(`  ⚠️ ${step.error}`);
        }
      }
    }

    if (run.output_stores && Object.keys(run.output_stores).length > 0) {
      lines.push('', `### Output Stores (${Object.keys(run.output_stores).length})`);
      for (const [key, value] of Object.entries(run.output_stores)) {
        const preview = typeof value === 'string'
          ? value.slice(0, 400) + (value.length > 400 ? '…' : '')
          : JSON.stringify(value).slice(0, 400) + '…';
        lines.push(`- **${key}:** ${preview}`);
      }
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting recipe run: ${message}` }],
      isError: true,
    };
  }
}
