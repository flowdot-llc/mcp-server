#!/usr/bin/env node
/**
 * FlowDot MCP Server CLI
 *
 * This is the entry point when running via npx @flowdot/mcp-server
 */

import('../dist/index.js').catch((error) => {
  console.error('Failed to start FlowDot MCP Server:', error.message);
  console.error('');
  console.error('If you see module errors, make sure the package is built:');
  console.error('  cd packages/mcp-server && npm run build');
  console.error('');
  process.exit(1);
});
