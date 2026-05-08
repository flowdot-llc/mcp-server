/**
 * list_shared_recipe_runs MCP Tool
 *
 * Lists published recipe runs (snapshots of completed recipe executions)
 * for one recipe. Used to discover what models other authors have run a
 * recipe with, what their tokens/cost looked like, and to find runs to
 * group into a benchmark.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listSharedRecipeRunsTool: Tool = {
  name: 'list_shared_recipe_runs',
  description:
    'List published runs for a recipe. Each run is a frozen snapshot of one execution including total tokens, duration, model lineup, and the final output stores. Use this to discover community runs, compare models a recipe has been run with, or find runs to bundle into a benchmark.',
  inputSchema: {
    type: 'object',
    properties: {
      recipe_hash: {
        type: 'string',
        description: 'The recipe hash (e.g. "g0AENsn8Wq")',
      },
      sort: {
        type: 'string',
        enum: ['newest', 'oldest', 'most_viewed', 'votes'],
        description: 'Sort order (default: newest)',
      },
      limit: {
        type: 'number',
        description: 'Maximum results (default: 20, max: 100)',
      },
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
      },
    },
    required: ['recipe_hash'],
  },
};

function formatRun(run: any): string {
  const lines = [
    `### ${run.title || `Run ${run.hash}`} (${run.hash})`,
    `**Status:** ${run.final_status} ${run.is_active ? '· active' : '· inactive'}`,
    `**Public URL:** ${run.share_url}`,
    `**Stats:** ${run.totals?.tokens ?? 0} tokens · ${run.totals?.duration_ms ?? 0}ms · ${run.totals?.tool_calls ?? 0} tool calls`,
    `**Views:** ${run.view_count} | **Votes:** ${run.vote_count}`,
    `**Created:** ${run.created_at}`,
  ];
  if (run.user) lines.push(`**Published by:** ${run.user.name}`);
  if (run.description) lines.push(`**Description:** ${run.description}`);
  if (run.model_lineup && Object.keys(run.model_lineup).length > 0) {
    const models = Object.values(run.model_lineup as Record<string, any>)
      .map((m) => m?.model)
      .filter(Boolean);
    if (models.length > 0) {
      lines.push(`**Models used:** ${[...new Set(models)].join(', ')}`);
    }
  }
  return lines.join('\n');
}

export async function handleListSharedRecipeRuns(
  api: FlowDotApiClient,
  args: { recipe_hash: string; sort?: string; limit?: number; page?: number },
): Promise<CallToolResult> {
  try {
    const result = await api.listSharedRecipeRuns(args.recipe_hash, {
      sort: args.sort as 'newest' | 'oldest' | 'most_viewed' | 'votes',
      limit: args.limit,
      page: args.page,
    });

    const runs = (result as any).data || [];
    if (runs.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No published runs for this recipe.\n\nTip: Authors publish runs from the CLI: `flowdot recipes publish <executionHash>`.',
          },
        ],
      };
    }

    const total = (result as any).total ?? runs.length;
    const currentPage = (result as any).current_page ?? 1;
    const lastPage = (result as any).last_page ?? 1;
    const header = `## Published Runs (${total} total, page ${currentPage}/${lastPage})\n\n`;
    return {
      content: [{ type: 'text', text: header + runs.map(formatRun).join('\n\n---\n\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing recipe runs: ${message}` }],
      isError: true,
    };
  }
}
