/**
 * list_recipes MCP Tool
 *
 * Lists agent recipes available to the user.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listRecipesTool: Tool = {
  name: 'list_recipes',
  description: `List agent recipes available to the user. Returns recipe IDs, names, descriptions, and step counts.

**What are Recipes?**
Recipes are reusable agent orchestration workflows. Design them with MCP tools, execute them via the FlowDot CLI.

**CRITICAL**: MCP tools can only DESIGN recipes. To RUN a recipe, use the CLI:
\`npx flowdot recipes run <aliasOrHash> --input '{"key":"value"}'\`

**Building a Recipe (workflow):**
1. create_recipe → Creates recipe, returns hash
2. add_recipe_store → Define inputs (is_input: true) and outputs (is_output: true)
   - **Name primary input store \`request\`** - CLI passes task as \`inputs.request\`
3. add_recipe_step → Add steps (agent, parallel, loop, gate, branch, invoke)
   - For agent steps, use \`user_prompt\` (NOT \`prompt\`) in config
4. update_recipe_step → Connect steps via "next" and "on_error"
5. update_recipe → Set entry_step_id to the first step
6. link_recipe → Create CLI alias for easy execution

**Step Types:** agent (LLM with tools), parallel (concurrent), loop (iterate array), gate (approval), branch (conditional), invoke (subroutine)

**Interpolation Syntax:**
- \`{{inputs.request}}\` - Access CLI task argument
- \`{{store_key}}\` - Reference store values`,
  inputSchema: {
    type: 'object',
    properties: {
      favorites_only: {
        type: 'boolean',
        default: false,
        description: 'Only return favorited recipes',
      },
    },
  },
};

export async function handleListRecipes(
  api: FlowDotApiClient,
  args: { favorites_only?: boolean }
): Promise<CallToolResult> {
  try {
    // listRecipes() now returns AgentRecipe[] directly (not wrapped in { recipes: [...] })
    let recipes = await api.listRecipes();

    // Filter favorites if requested
    if (args.favorites_only) {
      recipes = recipes.filter((r) => r.is_favorited);
    }

    if (recipes.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No recipes found. Create recipes to build reusable agent orchestration workflows.',
          },
        ],
      };
    }

    // Format as a readable list
    const recipeList = recipes
      .filter((r) => r && typeof r === 'object')
      .map((r) => {
        const desc = r.description ? ` - ${r.description}` : '';
        const visibility =
          r.visibility === 'public' ? ' (public)' : r.visibility === 'unlisted' ? ' (unlisted)' : '';
        const steps = r.step_count !== undefined ? ` [${r.step_count} steps]` : '';
        return `- **${r.name}** (${r.hash})${visibility}${steps}${desc}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${recipes.length} recipe(s):\n\n${recipeList}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error listing recipes: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
