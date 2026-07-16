/**
 * Progressive tool disclosure — category map + discovery tools.
 *
 * The published MCP server lists all ~200 tools at once (fine for MCP clients).
 * But the FlowDot CLI + native app put tool docs into the LLM PROMPT as text, so
 * dumping every tool blows past the ~128-tool ceiling and wastes input tokens on
 * every turn. This module mirrors the web `/agent`'s progressive disclosure
 * (Node `toolRegistry.js`): a tiny always-on discovery set, and the rest gated by
 * category and unlocked on demand via `learn_about(topic)`.
 *
 * Pure + side-effect free (safe to import from platform-tools.ts).
 */

import { tools as ALL_TOOLS } from './tools/index.js';
import { activeInteractiveCliTools } from './interactive-cli.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  renderLearn,
  getTopic,
  learnTopicsForSurface,
  type Surface,
} from '@flowdot.ai/platform-learn';

export type ToolCategory =
  | 'workflows'
  | 'apps'
  | 'recipes'
  | 'custom-nodes'
  | 'toolkits'
  | 'knowledge'
  | 'goals'
  | 'characters'
  | 'email'
  | 'comms'
  | 'interactive-cli';

export const TOOL_CATEGORIES: ToolCategory[] = [
  'workflows',
  'apps',
  'recipes',
  'custom-nodes',
  'toolkits',
  'knowledge',
  'goals',
  'characters',
  'email',
  'comms',
  'interactive-cli',
];

const MCP_FLOWDOT_PREFIX = 'mcp__flowdot__';

/**
 * Assign a tool to exactly one category by its (prefix-stripped) name. Order
 * matters — first match wins. `workflows` is the catch-all bucket (it also
 * absorbs nodes/connections/executions/sharing/presets/teams/search/analytics,
 * exactly as the web's WORKFLOW_TOOLS does).
 */
export function categoryForTool(rawName: string): ToolCategory {
  const n = rawName.startsWith(MCP_FLOWDOT_PREFIX)
    ? rawName.slice(MCP_FLOWDOT_PREFIX.length)
    : rawName;
  // interactive_cli__* FIRST — else it falls into the default-visible `workflows`
  // bucket and the opt-in prompt-budget goal is defeated (TERMINAL_EYES.md Part E).
  if (n.startsWith('interactive_cli')) return 'interactive-cli';
  // app before toolkit so link_app_toolkit lands in apps (it's an app op).
  if (n.includes('app')) return 'apps';
  if (n.includes('toolkit')) return 'toolkits';
  if (n.includes('recipe')) return 'recipes';
  if (n.includes('custom_node')) return 'custom-nodes';
  if (n.includes('character')) return 'characters';
  if (n.includes('goal') || n.includes('milestone')) return 'goals';
  if (n.includes('email')) return 'email';
  if (n.includes('notification') || n.includes('channel')) return 'comms';
  if (
    n.includes('knowledge') ||
    n.includes('document') ||
    n.includes('image') ||
    n.includes('kb_') ||
    n.includes('_kb')
  ) {
    return 'knowledge';
  }
  return 'workflows';
}

/** Return the (deduped) tools belonging to the given categories. */
export function toolsForCategories(
  categories: readonly string[],
  all: Tool[] = [...ALL_TOOLS, ...activeInteractiveCliTools()],
): Tool[] {
  const want = new Set(categories);
  const seen = new Set<string>();
  const out: Tool[] = [];
  for (const tool of all) {
    if (!want.has(categoryForTool(tool.name))) continue;
    if (seen.has(tool.name)) continue;
    seen.add(tool.name);
    out.push(tool);
  }
  return out;
}

// ---- learn_about topic → category (derived from @flowdot.ai/platform-learn) --
// The taxonomy + guidance are the single shared source now; the category a topic
// unlocks is `topic.category` there. `LEARN_TOPICS` is the set applicable to the
// local stdio MCP surface (the remote Hub connector filters separately).

export const LEARN_TOPICS = learnTopicsForSurface('mcp');

export function mapTopicToCategory(topic: string): ToolCategory | null {
  const cat = getTopic(topic)?.category ?? null;
  return (cat as ToolCategory | null) ?? null;
}

// ---- Discovery tools (always on) ------------------------------------------

export const RESOURCE_TYPES = [
  'workflows',
  'apps',
  'recipes',
  'custom_nodes',
  'toolkits',
  'knowledge_docs',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** Map a list_my_resources `type` to the platform list-tool that backs it. */
export function listToolForResourceType(type: string): string | null {
  switch (type) {
    case 'workflows':
      return 'list_workflows';
    case 'apps':
      return 'list_apps';
    case 'recipes':
      return 'list_recipes';
    case 'custom_nodes':
      return 'list_custom_nodes';
    case 'toolkits':
      return 'mcp__flowdot__list_installed_toolkits';
    case 'knowledge_docs':
      return 'list_knowledge_documents';
    default:
      return null;
  }
}

export const LEARN_ABOUT_TOOL: Tool = {
  name: 'learn_about',
  description:
    'Load a FlowDot area: returns a short how-to AND unlocks that area\'s full ' +
    'create/edit/manage tools (e.g. learn_about("apps") makes create_app, update_app, ' +
    'edit_app_code, etc. available). ALWAYS call this FIRST before trying to create or ' +
    'modify anything in an area — the action tools do not appear until you do. After it ' +
    'returns, call the unlocked tools directly.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: LEARN_TOPICS,
        description: 'The FlowDot area to load',
      },
    },
    required: ['topic'],
  },
};

export const LIST_MY_RESOURCES_TOOL: Tool = {
  name: 'list_my_resources',
  description:
    "List the current user's existing FlowDot resources of a given type (so you can " +
    'reference or edit them). Does not require learn_about first.',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: [...RESOURCE_TYPES],
        description: 'Which resource type to list',
      },
      limit: { type: 'number', description: 'Max results (optional)' },
    },
    required: ['type'],
  },
};

/** The always-on discovery tools exposed to the agent every turn. */
export const DISCOVERY_TOOLS: Tool[] = [LEARN_ABOUT_TOOL, LIST_MY_RESOURCES_TOOL];

/**
 * Resolve a learn_about call: a short guide listing the now-available tools +
 * the category to unlock for subsequent turns. Self-describing (built from the
 * live tool list) so it never drifts from the real toolset.
 */
export function learnAbout(
  topic: string,
  surface: Surface = 'mcp',
): {
  text: string;
  categoryToLoad: ToolCategory | null;
} {
  const t = getTopic(topic);
  if (!t) {
    return {
      text:
        'FlowDot areas you can load with learn_about: ' +
        TOOL_CATEGORIES.join(', ') +
        '. Call learn_about("<area>") to unlock that area\'s tools.',
      categoryToLoad: null,
    };
  }
  const category = (t.category as ToolCategory | null) ?? null;
  // Build this surface's actual tool signatures for the topic's category (if any),
  // then compose them with the shared concise prose. Topics without an MCP
  // category (browser/files/…) render prose only — their tools are LOCAL_ONLY and
  // always present in the MCP tool list.
  const toolsText = category
    ? toolsForCategories([category]).map(formatToolWithParams).join('\n\n')
    : '';
  const rendered = renderLearn(topic, { surface, toolsText });
  return { text: rendered.text, categoryToLoad: category };
}

/**
 * Format a tool with its full parameter list from inputSchema. The model needs
 * the exact param names to actually emit the action (name + description alone is
 * not enough for less-inferential models — they narrate instead of calling).
 */
function formatToolWithParams(tool: Tool): string {
  const schema = (tool.inputSchema ?? {}) as {
    properties?: Record<string, { description?: string }>;
    required?: string[];
  };
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const entries = Object.entries(props);
  const req = entries.filter(([k]) => required.has(k));
  const opt = entries.filter(([k]) => !required.has(k));
  const lines = [`- ${tool.name}: ${tool.description}`];
  if (req.length) {
    lines.push('  required: ' + req.map(([k, v]) => `${k} (${v.description ?? ''})`).join('; '));
  }
  if (opt.length) {
    lines.push('  optional: ' + opt.map(([k, v]) => `${k} (${v.description ?? ''})`).join('; '));
  }
  return lines.join('\n');
}
