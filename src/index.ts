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

// Stability hardening: a driven browser page can crash / disconnect and emit a
// late async rejection. Without these, that would terminate the whole MCP server
// (killing every session + the stdio connection). A bad op should fail ONE tool
// call, not take down the harness. Mirrors electron-qa-mcp's server hardening.
process.on('unhandledRejection', (reason) => {
  console.error('[flowdot-mcp] Unhandled promise rejection (server stays up):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[flowdot-mcp] Uncaught exception (server stays up):', err);
});

startServer().catch((error) => {
  console.error('Failed to start FlowDot MCP Server:', error);
  process.exit(1);
});
