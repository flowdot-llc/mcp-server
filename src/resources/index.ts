/**
 * MCP Resources Registry
 *
 * The `learn://` learning resources agents read to understand FlowDot. The
 * CONTENT is now the single shared source `@flowdot.ai/platform-learn` (concise,
 * surface-aware) — this module just re-exports the map and registers it. Nothing
 * here is hand-authored; edit topics in the shared package.
 *
 * - `LEARN_RESOURCES` — the set for the LOCAL stdio MCP server (surface `mcp`),
 *   which CAN run LOCAL_ONLY families, so it includes browser/documents.
 * - `LEARN_RESOURCES_REMOTE` — the set for the Hub OAuth connector (surface
 *   `mcp-remote`), which is Hub-only, so it EXCLUDES local-only guides. The
 *   manifest emitter (`scripts/emit-manifest.mjs`) syncs THIS one to the Hub.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { learnResourcesForSurface, learnIndex } from '@flowdot.ai/platform-learn';

/** Local stdio MCP server resource set (includes LOCAL_ONLY browser/documents). */
export const LEARN_RESOURCES = learnResourcesForSurface('mcp');

/** Hub OAuth connector resource set (Hub-only; excludes local-only guides). */
export const LEARN_RESOURCES_REMOTE = learnResourcesForSurface('mcp-remote');

/** The "start here" index of learning resources, derived from the shared source. */
export const LEARN_INDEX = learnIndex('mcp');

/**
 * Register learning resources with the (local stdio) MCP server.
 */
export function registerResources(server: Server): void {
  // Handle list resources request
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: Object.entries(LEARN_RESOURCES).map(([uri, resource]) => ({
        uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  });

  // Handle read resource request
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const resource = LEARN_RESOURCES[uri as keyof typeof LEARN_RESOURCES];

    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: resource.content,
        },
      ],
    };
  });

  console.error('Learning resources registered. Available resources:');
  Object.keys(LEARN_RESOURCES).forEach((uri) => {
    console.error(`  • ${uri}`);
  });
}
