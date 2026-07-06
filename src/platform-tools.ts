/**
 * Platform-tools surface — side-effect-free re-exports.
 *
 * The package entry (`src/index.ts`) calls `startServer()` at import time, so it
 * cannot be imported as a library. This module re-exports ONLY the pure pieces
 * other FlowDot surfaces need to run the platform tools themselves — no MCP
 * `Server`, no stdio, no server start:
 *
 *   - `tools`            — the static Tool[] schema list (name/description/inputSchema)
 *   - `dispatchToolCall` — pure (api, request) → CallToolResult tool dispatcher
 *   - `capabilitiesFor`  — pure tool-name → guardian CapabilityClass[] mapper
 *
 * Consumed by the FlowDot Native app's main process so its Agent can advertise
 * and execute the full platform tool surface directly against the Hub (as the
 * authenticated user, guardian-gated) WITHOUT spawning this MCP server. Keep this
 * module free of import-time side effects.
 */

export { tools, dispatchToolCall } from './tools/index.js';
export { capabilitiesFor } from './tool-capabilities.js';
export type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Progressive disclosure (keep the CLI/native prompt tool count < 128).
export {
  type ToolCategory,
  type ResourceType,
  TOOL_CATEGORIES,
  RESOURCE_TYPES,
  DISCOVERY_TOOLS,
  LEARN_ABOUT_TOOL,
  LIST_MY_RESOURCES_TOOL,
  LEARN_TOPICS,
  categoryForTool,
  toolsForCategories,
  mapTopicToCategory,
  listToolForResourceType,
  learnAbout,
} from './tool-categories.js';
