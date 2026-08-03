/**
 * Regression tests for `browse_recipes`.
 *
 * Bug (found by packaged native QA, 2026-08-01): the tool reported
 * "No public recipes found matching your criteria." for a library that had
 * plenty — reproducible both through the desktop agent and straight through the
 * MCP server.
 *
 * `FlowDotApiClient.request()` already strips the Hub's `{ success, data }`
 * envelope and resolves to `data`, which `/agent-recipes/public` serves as a
 * bare array. The handler then read `response.data` off that array, got
 * `undefined`, and fell into the empty branch every time. The declared
 * `PublicRecipeListResult` page object described the PRE-unwrap body, so the
 * types agreed with the mistake and nothing caught it.
 *
 * That made "ask the agent to find a public recipe" impossible: the only
 * discovery tool the agent has always answered that the library was empty.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleBrowseRecipes } from './browse-recipes.js';
import type { FlowDotApiClient } from '../api-client.js';

function apiReturning(recipes: unknown): FlowDotApiClient {
  return {
    listPublicRecipes: vi.fn().mockResolvedValue(recipes),
  } as unknown as FlowDotApiClient;
}

const HUB_ROW = {
  hash: 'Hq2y5JxsUZ',
  name: 'Explore Mode',
  description: 'Targeted multi-agent code exploration (read-only).',
  step_count: 6,
  fork_count: 2,
  upvotes: 5,
  downvotes: 1,
  author: { hash: 'u1', display_name: 'Elliot' },
};

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content.map((c) => c.text ?? '').join('\n');
}

describe('handleBrowseRecipes', () => {
  it('lists recipes from the bare array the client resolves to (the exact bug)', async () => {
    const api = apiReturning([HUB_ROW]);

    const result = await handleBrowseRecipes(api, {});

    const text = textOf(result);
    expect(text).not.toContain('No public recipes found');
    expect(text).toContain('Explore Mode');
    expect(text).toContain('Hq2y5JxsUZ');
  });

  it('renders the author and score from the fields the Hub actually sends', async () => {
    // The Hub nests `author.display_name` and splits `upvotes`/`downvotes`; the
    // old `user_name` / `vote_count` reads were never populated, so both were
    // silently missing from every listing.
    const api = apiReturning([HUB_ROW]);

    const text = textOf(await handleBrowseRecipes(api, {}));

    expect(text).toContain('by Elliot');
    expect(text).toContain('[6 steps]');
    expect(text).toContain('2 forks');
    expect(text).toContain('+4'); // 5 upvotes - 1 downvote
  });

  it('still reports an empty library honestly', async () => {
    const api = apiReturning([]);

    expect(textOf(await handleBrowseRecipes(api, {}))).toContain('No public recipes found');
  });

  it('reports the page it fetched rather than inventing a total', async () => {
    // The Hub's `pagination` block is a sibling of `data` and does not survive
    // the client's envelope unwrap, so there is no honest total to print.
    const api = apiReturning([HUB_ROW]);

    const text = textOf(await handleBrowseRecipes(api, { page: 3 }));

    expect(text).toContain('Page 3');
    expect(text).toContain('1 recipe(s) returned');
  });

  it('passes the caller filters through to the client', async () => {
    const api = apiReturning([]);

    await handleBrowseRecipes(api, { search: 'explore', category: 'development', page: 2 });

    expect(api.listPublicRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'explore', category: 'development', page: 2 }),
    );
  });

  it('surfaces a client failure as a tool error', async () => {
    const api = {
      listPublicRecipes: vi.fn().mockRejectedValue(new Error('403 Forbidden')),
    } as unknown as FlowDotApiClient;

    const result = await handleBrowseRecipes(api, {});

    expect(result.isError).toBe(true);
    expect(textOf(result as never)).toContain('403 Forbidden');
  });
});
