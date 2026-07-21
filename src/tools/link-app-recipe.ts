/**
 * link_app_recipe Tool
 *
 * Link a recipe to an app so the app can TRIGGER it (window.recipe.run()).
 * Recipe runs happen in the FlowDot desktop (native) app; this link is the
 * authorization gate. Required scope: apps:manage.
 * See Docs/DevGuides/APPS_AND_RECIPES.md.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const linkAppRecipeTool: Tool = {
  name: 'link_app_recipe',
  description: `Link a recipe to an app so the app can TRIGGER it from the FlowDot desktop app.

The recipe must be owned by you. Recipes run client-side (native/CLI), not on the server; the link is the sole authorization gate, and every run also requires the viewer to approve a per-run consent prompt.

After linking, app code (in the native app) can run it:

\`\`\`javascript
const out = await window.recipe.run('RECIPE_HASH_OR_ALIAS', { /* inputs */ });
// out = { executionId, status, outputs }
\`\`\``,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: { type: 'string', description: 'The app ID (hash) to link the recipe to' },
      recipe_hash: { type: 'string', description: 'The recipe hash to link (must be owned by you)' },
      alias: { type: 'string', description: 'Optional friendly alias the app code can use' },
    },
    required: ['app_id', 'recipe_hash'],
  },
};

export async function handleLinkAppRecipe(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const recipeHash = String(args.recipe_hash);
    const alias = args.alias ? String(args.alias) : undefined;

    const result = await client.linkAppRecipe(appId, recipeHash, alias);

    const text = `Recipe linked successfully!

**Recipe:** ${result.name} (${result.hash})
${result.alias ? `**Alias:** ${result.alias}` : ''}

## Usage in App Code (native desktop app)

\`\`\`javascript
const out = await window.recipe.run('${result.alias || result.hash}', {
  // your inputs here
});
\`\`\``;

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error linking recipe: ${message}` }],
      isError: true,
    };
  }
}
