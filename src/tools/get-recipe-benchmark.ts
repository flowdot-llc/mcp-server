/**
 * get_recipe_benchmark MCP Tool
 *
 * Fetches one benchmark (paired-run comparison) with full per-run details
 * — token totals, durations, model lineups, and speculative cost. Used to
 * understand WHY a particular configuration won or lost.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getRecipeBenchmarkTool: Tool = {
  name: 'get_recipe_benchmark',
  description:
    'Get a published recipe benchmark with all of its grouped runs side-by-side. Each run carries totals, model lineup per step, and speculative cost computed from current model pricing. Use this to compare configurations on the same recipe and reason about cost/quality tradeoffs.',
  inputSchema: {
    type: 'object',
    properties: {
      recipe_hash: { type: 'string', description: 'The recipe hash' },
      benchmark_hash: { type: 'string', description: 'The benchmark hash (10 chars)' },
    },
    required: ['recipe_hash', 'benchmark_hash'],
  },
};

export async function handleGetRecipeBenchmark(
  api: FlowDotApiClient,
  args: { recipe_hash: string; benchmark_hash: string },
): Promise<CallToolResult> {
  try {
    const benchmark = await api.getRecipeBenchmark(args.recipe_hash, args.benchmark_hash) as any;

    const lines: string[] = [
      `## ${benchmark.title}`,
      '',
      `**Hash:** ${benchmark.hash}`,
      `**Public URL:** ${benchmark.share_url}`,
      `**Recipe:** ${benchmark.recipe?.title || benchmark.recipe?.name}`,
      `**Runs:** ${benchmark.runs?.length ?? 0} · **Views:** ${benchmark.view_count} · **Votes:** ${benchmark.vote_count}`,
      `**Created:** ${benchmark.created_at}`,
    ];
    if (benchmark.user) lines.push(`**Published by:** ${benchmark.user.name}`);
    if (benchmark.description) lines.push('', `**Description:** ${benchmark.description}`);

    const runs = (benchmark.runs as any[]) || [];
    if (runs.length > 0) {
      lines.push('', '### Runs in this benchmark', '');
      for (const r of runs) {
        const cost = r.speculative_cost?.totals?.cost;
        const costStr = typeof cost === 'number' ? `$${cost.toFixed(6)}` : '—';
        lines.push(`#### ${r.label || r.title || `Run ${r.hash}`}`);
        lines.push(`- **Run hash:** ${r.hash}`);
        lines.push(`- **Status:** ${r.final_status}`);
        lines.push(`- **Tokens:** ${r.totals?.tokens ?? 0} (↑${r.totals?.input_tokens ?? 0} ↓${r.totals?.output_tokens ?? 0})`);
        lines.push(`- **Duration:** ${r.totals?.duration_ms ?? 0}ms · **Tool calls:** ${r.totals?.tool_calls ?? 0}`);
        lines.push(`- **Speculative cost:** ${costStr}`);
        if (r.model_lineup && Object.keys(r.model_lineup).length > 0) {
          const models = Object.values(r.model_lineup as Record<string, any>)
            .map((m) => m?.model)
            .filter(Boolean);
          lines.push(`- **Models:** ${[...new Set(models)].join(', ')}`);
        }
        lines.push(`- **Run URL:** ${r.share_url}`);
        lines.push('');
      }
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting benchmark: ${message}` }],
      isError: true,
    };
  }
}
