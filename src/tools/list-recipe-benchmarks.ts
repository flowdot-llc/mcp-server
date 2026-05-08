/**
 * list_recipe_benchmarks MCP Tool
 *
 * Lists published benchmarks (groups of 2+ recipe runs presented together
 * for side-by-side comparison) for one recipe.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listRecipeBenchmarksTool: Tool = {
  name: 'list_recipe_benchmarks',
  description:
    'List published benchmarks for a recipe. A benchmark groups two or more runs together so viewers can compare cost, tokens, duration, and final outputs across model configurations.',
  inputSchema: {
    type: 'object',
    properties: {
      recipe_hash: { type: 'string', description: 'The recipe hash' },
      limit: { type: 'number', description: 'Maximum results (default: 20, max: 100)' },
      page: { type: 'number', description: 'Page number (default: 1)' },
    },
    required: ['recipe_hash'],
  },
};

export async function handleListRecipeBenchmarks(
  api: FlowDotApiClient,
  args: { recipe_hash: string; limit?: number; page?: number },
): Promise<CallToolResult> {
  try {
    const result = await api.listRecipeBenchmarks(args.recipe_hash, {
      limit: args.limit,
      page: args.page,
    });

    const benches = (result as any).data || [];
    if (benches.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No benchmarks for this recipe.\n\nTip: Authors publish benchmarks from the CLI: `flowdot recipes publish-benchmark <runHash1> <runHash2> --title ...`.',
          },
        ],
      };
    }

    const total = (result as any).total ?? benches.length;
    const currentPage = (result as any).current_page ?? 1;
    const lastPage = (result as any).last_page ?? 1;
    const lines: string[] = [`## Benchmarks (${total} total, page ${currentPage}/${lastPage})`, ''];

    for (const b of benches) {
      lines.push(`### ${b.title} (${b.hash})`);
      lines.push(`**Public URL:** ${b.share_url}`);
      lines.push(`**Runs:** ${b.run_count} · **Views:** ${b.view_count} · **Votes:** ${b.vote_count}`);
      if (b.user) lines.push(`**Published by:** ${b.user.name}`);
      lines.push(`**Created:** ${b.created_at}`);
      if (b.description) lines.push(`**Description:** ${b.description}`);
      lines.push('');
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing benchmarks: ${message}` }],
      isError: true,
    };
  }
}
