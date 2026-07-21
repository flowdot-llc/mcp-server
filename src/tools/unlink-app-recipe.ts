/**
 * unlink_app_recipe Tool
 *
 * Unlink a recipe from an app (revokes the app's ability to trigger it).
 * Required scope: apps:manage.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const unlinkAppRecipeTool: Tool = {
  name: 'unlink_app_recipe',
  description: `Unlink a recipe from an app. The app can no longer trigger that recipe.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: { type: 'string', description: 'The app ID (hash)' },
      recipe_hash: { type: 'string', description: 'The recipe hash to unlink' },
    },
    required: ['app_id', 'recipe_hash'],
  },
};

export async function handleUnlinkAppRecipe(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const recipeHash = String(args.recipe_hash);
    await client.unlinkAppRecipe(appId, recipeHash);
    return { content: [{ type: 'text', text: `Recipe ${recipeHash} unlinked from app ${appId}.` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error unlinking recipe: ${message}` }],
      isError: true,
    };
  }
}
