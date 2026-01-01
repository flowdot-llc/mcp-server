/**
 * FlowDot MCP Server
 *
 * Connect Claude Desktop, Cursor, and other MCP-compatible AI tools
 * to FlowDot workflows.
 *
 * Usage:
 *   FLOWDOT_API_TOKEN=fd_mcp_xxx npx @flowdot.ai/mcp-server
 *
 * Or configure in Claude Desktop:
 *   {
 *     "mcpServers": {
 *       "flowdot": {
 *         "command": "npx",
 *         "args": ["@flowdot.ai/mcp-server"],
 *         "env": {
 *           "FLOWDOT_API_TOKEN": "fd_mcp_your_token_here"
 *         }
 *       }
 *     }
 *   }
 */

export { FlowDotApiClient } from './api-client.js';
export { createServer, startServer } from './server.js';
export * from './types.js';

// If running directly (not imported as a module)
import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Failed to start FlowDot MCP Server:', error);
  process.exit(1);
});
